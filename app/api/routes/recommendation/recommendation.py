from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional,Dict
import pandas as pd
import os

from app.core.data_cleaning import (
    clean_contrats_data, clean_sinistres_data, 
    clean_clients_data, clean_business_data, clean_products_data
)
from app.services.scoring_services import scoring_service
from app.services.batch_processor import batch_processor
from app.services.recommendation_service import recommendation_service
from app.utils.sql_transformer import sql_transformer
from app.core.config import logger

router = APIRouter()

class ScoringRequest(BaseModel):
    df_contrats_path: str = "data/raw/contrats.parquet"
    df_clients_path: str = "data/raw/clients.parquet"
    df_business_path: str = "data/raw/businesses.parquet"
    df_products_path: str = "data/raw/products.parquet"
    save_individual_path: Optional[str] = "data/processed/individual_scores.parquet"
    save_business_path: Optional[str] = "data/processed/business_scores.parquet"
    
class SQLConversionRequest(BaseModel):
    file_mappings: List[Dict[str, str]]  # [{"parquet_path": "path", "table_name": "name"}]
    columns_mapping: Optional[Dict[str, List[str]]] = None  # {"table_name": ["col1", "col2"]}
    where_conditions: Optional[Dict[str, str]] = None  # {"table_name": "column > value"}
    generate_ddl: bool = False
    primary_keys: Optional[Dict[str, str]] = None  # {"table_name": "primary_key_column"}

class RecommendationRequest(BaseModel):
    df_sinistres_path: Optional[str] = "data/raw/claims.parquet"
    batch_size: int = 1000

@router.post("/insurance/score-clients")
async def score_clients_endpoint(request: ScoringRequest, background_tasks: BackgroundTasks):
    """Endpoint to score all clients using data files"""
    try:
        # Create directories if they don't exist
        os.makedirs("data/raw", exist_ok=True)
        os.makedirs("data/processed", exist_ok=True)
        
        # Load data from files
        logger.info(f"Loading data from: {request.df_contrats_path}")
        df_contrats = pd.read_parquet(request.df_contrats_path)
        df_clients = pd.read_parquet(request.df_clients_path)
        df_business = pd.read_parquet(request.df_business_path)
        df_products = pd.read_parquet(request.df_products_path)
        
        # Clean data
        logger.info("Cleaning data...")
        df_contrats_clean = clean_contrats_data(df_contrats)
        df_clients_clean = clean_clients_data(df_clients)
        df_business_clean = clean_business_data(df_business)
        df_products_clean = clean_products_data(df_products)
        
        # Score clients
        logger.info("Scoring clients...")
        scored_individuals, scored_business = scoring_service.score_all_clients(
            df_contrats_clean, df_clients_clean, df_business_clean
        )
        
        # Store the data in the service for later use
        scoring_service.df_contrats = df_contrats_clean
        scoring_service.df_products = df_products_clean
        
        # Save if path provided
        if request.save_individual_path or request.save_business_path:
            background_tasks.add_task(scoring_service.save_scores, request.save_individual_path,request.save_business_path)
            logger.info(f"Scores will be saved to: {request.save_individual_path} and {request.save_business_path}")
        
        return {
            "message": "Clients scored successfully",
            "individual_clients": len(scored_individuals),
            "business_clients": len(scored_business),
            "individual_scores_path": request.save_individual_path,
            "business_scores_path": request.save_business_path
        }
        
    except FileNotFoundError as e:
        logger.error(f"Data file not found: {e}")
        raise HTTPException(status_code=404, detail=f"Data file not found: {e}")
    except Exception as e:
        logger.error(f"Error in score-clients endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insurance/scores")
async def get_scores_endpoint(client_type: str = "all"):
    """Endpoint to get scored clients"""
    try:
        scored_clients = scoring_service.get_scored_clients(client_type)
        return {
            "client_type": client_type,
            "count": len(scored_clients),
            "scores_available": True,
            "sample_data": scored_clients.head(2).to_dict('records') if not scored_clients.empty else []
        }
    except Exception as e:
        logger.error(f"Error in get-scores endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insurance/generate-recommendations")
async def generate_recommendations_endpoint(request: RecommendationRequest, background_tasks: BackgroundTasks):
    """Endpoint to generate recommendations using data files"""
    try:
        # Create directories if they don't exist
        os.makedirs("data/raw", exist_ok=True)
        os.makedirs("data/processed", exist_ok=True)
        
        # Load claims data if provided
        df_sinistres = None
        if request.df_sinistres_path and os.path.exists(request.df_sinistres_path):
            logger.info(f"Loading claims data from: {request.df_sinistres_path}")
            df_sinistres = pd.read_parquet(request.df_sinistres_path)
            df_sinistres = clean_sinistres_data(df_sinistres)
        else:
            logger.info("No claims data provided or file not found")
        
        # Get scored clients
        scored_clients = scoring_service.get_scored_clients()
        
        if scored_clients.empty:
            raise HTTPException(status_code=400, detail="No scored clients found. Please run scoring first.")
        
        # Set batch size
        batch_processor.batch_size = request.batch_size
        
        # Set resume mode based on whether we have existing recommendations
        individual_path = "data/processed/individual_recommendations.parquet"
        business_path = "data/processed/business_recommendations.parquet"
        
        if os.path.exists(individual_path) or os.path.exists(business_path):
            batch_processor.set_resume_mode(True)
            logger.info("Resume mode activated - will process only new clients")
        
        # Generate recommendations
        logger.info("Generating recommendations...")
        individual_recs, business_recs, alerts = recommendation_service.generate_recommendations(
            scored_clients, scoring_service.df_contrats, scoring_service.df_products, df_sinistres
        )
        
        # Save results in background
        background_tasks.add_task(recommendation_service.save_recommendations, individual_path, business_path)
        background_tasks.add_task(recommendation_service.save_alerts, "data/processed/alerts.parquet")
        
        return {
            "message": "Recommendations generated successfully",
            "individual_recommendations_count": len(individual_recs),
            "business_recommendations_count": len(business_recs),
            "alerts_count": len(alerts),
            "processed_batches": batch_processor.current_batch,
            "processed_clients": len(batch_processor.processed_clients),
            "resume_mode": batch_processor.resume_mode
        }
        
    except Exception as e:
        logger.error(f"Error in generate-recommendations endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insurance/recommendations/{client_id}")
async def get_recommendations_for_client(client_id: str, client_type: Optional[str] = None):
    """Get recommendations for a specific client"""
    try:
        # Determine client type if not provided
        if not client_type:
            scored_clients = scoring_service.get_scored_clients()
            client_data = scored_clients[scored_clients['REF_PERSONNE'] == client_id]
            if not client_data.empty:
                client_type = client_data.iloc[0]['client_type']
            else:
                raise HTTPException(status_code=404, detail=f"Client {client_id} not found")
        
        # Load recommendations if not in memory
        if recommendation_service.individual_recommendations.empty or recommendation_service.business_recommendations.empty:
            individual_path = "data/processed/individual_recommendations.parquet"
            business_path = "data/processed/business_recommendations.parquet"
            
            if os.path.exists(individual_path):
                recommendation_service.individual_recommendations = pd.read_parquet(individual_path)
            if os.path.exists(business_path):
                recommendation_service.business_recommendations = pd.read_parquet(business_path)
        
        if client_type == 'individual':
            client_recommendations = recommendation_service.individual_recommendations[
                recommendation_service.individual_recommendations['REF_PERSONNE'] == client_id
            ]
        else:  # business
            client_recommendations = recommendation_service.business_recommendations[
                recommendation_service.business_recommendations['REF_PERSONNE'] == client_id
            ]
        
        if client_recommendations.empty:
            raise HTTPException(status_code=404, detail=f"Client {client_id} not found in recommendations")
        
        return client_recommendations.to_dict('records')[0]
        
    except Exception as e:
        logger.error(f"Error getting recommendations for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insurance/recommendations")
async def get_all_recommendations(client_type: Optional[str] = None, limit: int = 10):
    """Get all recommendations with optional filtering by client type"""
    try:
        # Load recommendations if not in memory
        if recommendation_service.individual_recommendations.empty or recommendation_service.business_recommendations.empty:
            individual_path = "data/processed/individual_recommendations.parquet"
            business_path = "data/processed/business_recommendations.parquet"
            
            if os.path.exists(individual_path):
                recommendation_service.individual_recommendations = pd.read_parquet(individual_path)
            if os.path.exists(business_path):
                recommendation_service.business_recommendations = pd.read_parquet(business_path)
        
        if client_type == 'individual':
            results = recommendation_service.individual_recommendations.head(limit)
        elif client_type == 'business':
            results = recommendation_service.business_recommendations.head(limit)
        else:
            # Combine both with type indicator
            individual = recommendation_service.individual_recommendations.head(limit)
            business = recommendation_service.business_recommendations.head(limit)
            results = pd.concat([individual, business], ignore_index=True)
        
        return {
            "client_type": client_type or "all",
            "count": len(results),
            "recommendations": results.to_dict('records')
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insurance/data-structure")
async def get_data_structure():
    """Endpoint to check data file structure"""
    try:
        data_files = {}
        data_dir = "data/raw"
        
        if os.path.exists(data_dir):
            for file in os.listdir(data_dir):
                if file.endswith('.parquet'):
                    file_path = os.path.join(data_dir, file)
                    try:
                        df = pd.read_parquet(file_path)
                        data_files[file] = {
                            "rows": len(df),
                            "columns": list(df.columns),
                            "sample": df.head(2).to_dict('records')
                        }
                    except Exception as e:
                        data_files[file] = {"error": str(e)}
        
        return {
            "data_directory": data_dir,
            "files": data_files,
            "processed_directory": "data/processed",
            "processed_files": os.listdir("data/processed") if os.path.exists("data/processed") else []
        }
        
    except Exception as e:
        logger.error(f"Error checking data structure: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/data/convert-to-sql")
async def convert_to_sql_endpoint(request: SQLConversionRequest):
    """Convert Parquet files to SQL INSERT statements with column selection"""
    try:
        # Prepare file mappings
        file_mappings = []
        for mapping in request.file_mappings:
            file_mappings.append((mapping['parquet_path'], mapping['table_name']))
        
        # Convert to SQL
        results = sql_transformer.batch_convert_to_sql(
            file_mappings=file_mappings,
            columns_mapping=request.columns_mapping,
            where_conditions=request.where_conditions
        )
        
        # Generate DDL if requested
        ddl_results = {}
        if request.generate_ddl and request.primary_keys:
            for mapping in request.file_mappings:
                table_name = mapping['table_name']
                parquet_path = mapping['parquet_path']
                primary_key = request.primary_keys.get(table_name)
                
                if primary_key:
                    try:
                        columns = request.columns_mapping.get(table_name) if request.columns_mapping else None
                        ddl_path = sql_transformer.generate_table_ddl(
                            parquet_path, table_name, columns, primary_key
                        )
                        ddl_results[table_name] = {'ddl_path': ddl_path, 'status': 'success'}
                    except Exception as e:
                        ddl_results[table_name] = {'ddl_path': None, 'status': 'error', 'error': str(e)}
        
        return {
            "message": "SQL conversion completed",
            "insert_results": results,
            "ddl_results": ddl_results if ddl_results else "DDL generation skipped",
            "output_directory": sql_transformer.output_dir
        }
        
    except Exception as e:
        logger.error(f"Error in convert-to-sql endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/sql-files")
async def list_sql_files():
    """List all generated SQL files"""
    try:
        sql_files = []
        if os.path.exists(sql_transformer.output_dir):
            for file in os.listdir(sql_transformer.output_dir):
                if file.endswith('.sql'):
                    file_path = os.path.join(sql_transformer.output_dir, file)
                    file_size = os.path.getsize(file_path)
                    sql_files.append({
                        'filename': file,
                        'path': file_path,
                        'size_bytes': file_size,
                        'size_mb': round(file_size / (1024 * 1024), 2)
                    })
        
        return {
            "sql_directory": sql_transformer.output_dir,
            "files": sql_files,
            "total_files": len(sql_files)
        }
        
    except Exception as e:
        logger.error(f"Error listing SQL files: {e}")
        raise HTTPException(status_code=500, detail=str(e))