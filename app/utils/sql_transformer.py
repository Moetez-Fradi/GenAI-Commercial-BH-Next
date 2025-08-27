import pandas as pd
import numpy as np
import os
from datetime import datetime
from app.core.config import logger

class SQLTransformer:
    def __init__(self, output_dir="data/sql"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def parquet_to_sql(self, parquet_path, table_name, columns=None, where_condition=None):
        """
        Convert Parquet file to SQL INSERT statements with column selection
        
        Args:
            parquet_path: Path to the Parquet file
            table_name: Name of the SQL table
            columns: List of columns to include (None for all columns)
            where_condition: Optional WHERE condition to filter rows
        """
        try:
            # Read Parquet file
            df = pd.read_parquet(parquet_path)
            
            # Filter columns if specified
            if columns:
                missing_cols = set(columns) - set(df.columns)
                if missing_cols:
                    logger.warning(f"Columns not found in data: {missing_cols}")
                df = df[[col for col in columns if col in df.columns]]
            
            # Apply WHERE condition if specified
            if where_condition:
                df = df.query(where_condition)
            
            # Generate SQL file
            sql_content = self._generate_sql_inserts(df, table_name)
            
            # Save to file
            sql_filename = f"{table_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
            sql_path = os.path.join(self.output_dir, sql_filename)
            
            with open(sql_path, 'w', encoding='utf-8') as f:
                f.write(sql_content)
            
            logger.info(f"SQL file generated: {sql_path}")
            logger.info(f"Table: {table_name}, Rows: {len(df)}, Columns: {len(df.columns)}")
            
            return sql_path, len(df)
            
        except Exception as e:
            logger.error(f"Error converting {parquet_path} to SQL: {e}")
            raise
    
    def _generate_sql_inserts(self, df, table_name):
        """Generate SQL INSERT statements from DataFrame"""
        sql_lines = []
        
        # Add header
        sql_lines.append(f"-- SQL INSERT statements for table: {table_name}")
        sql_lines.append(f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        sql_lines.append(f"-- Total rows: {len(df)}")
        sql_lines.append("")
        
        # Process each row
        for _, row in df.iterrows():
            columns = []
            values = []
            
            for col, value in row.items():
                columns.append(col)
                
                if pd.isna(value):
                    values.append("NULL")
                elif isinstance(value, (int, float, np.number)):
                    values.append(str(value))
                elif isinstance(value, (pd.Timestamp, datetime)):
                    values.append(f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'")
                else:
                    # Escape single quotes for SQL
                    escaped_value = str(value).replace("'", "''")
                    values.append(f"'{escaped_value}'")
            
            columns_str = ", ".join(columns)
            values_str = ", ".join(values)
            
            sql_lines.append(f"INSERT INTO {table_name} ({columns_str}) VALUES ({values_str});")
        
        return "\n".join(sql_lines)
    
    def batch_convert_to_sql(self, file_mappings, columns_mapping=None, where_conditions=None):
        """
        Convert multiple Parquet files to SQL in batch
        
        Args:
            file_mappings: List of tuples (parquet_path, table_name)
            columns_mapping: Dict of {table_name: [columns]} for column selection
            where_conditions: Dict of {table_name: where_condition} for filtering
        """
        results = {}
        
        for parquet_path, table_name in file_mappings:
            if not os.path.exists(parquet_path):
                logger.warning(f"Parquet file not found: {parquet_path}")
                continue
            
            columns = columns_mapping.get(table_name, None) if columns_mapping else None
            where_condition = where_conditions.get(table_name, None) if where_conditions else None
            
            try:
                sql_path, row_count = self.parquet_to_sql(
                    parquet_path, table_name, columns, where_condition
                )
                results[table_name] = {
                    'sql_path': sql_path,
                    'row_count': row_count,
                    'status': 'success'
                }
            except Exception as e:
                results[table_name] = {
                    'sql_path': None,
                    'row_count': 0,
                    'status': 'error',
                    'error': str(e)
                }
        
        return results
    
    def generate_table_ddl(self, parquet_path, table_name, columns=None, primary_key=None):
        """
        Generate CREATE TABLE DDL statement from Parquet schema
        """
        try:
            df = pd.read_parquet(parquet_path)
            
            # Filter columns if specified
            if columns:
                df = df[[col for col in columns if col in df.columns]]
            
            ddl_lines = []
            ddl_lines.append(f"CREATE TABLE {table_name} (")
            
            # Add columns
            column_defs = []
            for col in df.columns:
                col_type = self._infer_sql_type(df[col])
                column_defs.append(f"    {col} {col_type}")
            
            # Add primary key if specified
            if primary_key and primary_key in df.columns:
                column_defs.append(f"    PRIMARY KEY ({primary_key})")
            
            ddl_lines.append(",\n".join(column_defs))
            ddl_lines.append(");")
            
            ddl_content = "\n".join(ddl_lines)
            
            # Save DDL to file
            ddl_filename = f"create_{table_name}.sql"
            ddl_path = os.path.join(self.output_dir, ddl_filename)
            
            with open(ddl_path, 'w', encoding='utf-8') as f:
                f.write(ddl_content)
            
            logger.info(f"DDL file generated: {ddl_path}")
            return ddl_path
            
        except Exception as e:
            logger.error(f"Error generating DDL for {table_name}: {e}")
            raise
    
    def _infer_sql_type(self, series):
        """Infer SQL data type from pandas Series"""
        dtype = series.dtype
        
        if pd.api.types.is_integer_dtype(dtype):
            return "INTEGER"
        elif pd.api.types.is_float_dtype(dtype):
            return "DECIMAL(15, 2)"
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            return "DATETIME"
        elif pd.api.types.is_bool_dtype(dtype):
            return "BOOLEAN"
        else:
            # For strings, find max length
            max_length = series.astype(str).str.len().max()
            if pd.isna(max_length):
                max_length = 50
            else:
                max_length = min(int(max_length * 1.5), 4000)  # Add buffer, cap at 4000
            return f"VARCHAR({max_length})"

# Global SQL transformer instance
sql_transformer = SQLTransformer()