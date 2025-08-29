from app.core.config import logger, ALERT_CONFIG

class BatchProcessor:
    def __init__(self, batch_size=10):
        self.batch_size = batch_size
        self.current_batch = 0
        self.processed_clients = set()
        self.resume_mode = False
    
    def process_in_batches(self, df_scored, process_function, *args, **kwargs):
        """Process clients in batches with resume capability"""
        results = []
        total_clients = len(df_scored)
        
        # Filter out already processed clients if in resume mode
        if self.resume_mode:
            df_to_process = df_scored[~df_scored['REF_PERSONNE'].isin(self.processed_clients)]
            logger.info(f"Resuming from {len(self.processed_clients)} processed clients. {len(df_to_process)} remaining.")
        else:
            df_to_process = df_scored
            self.processed_clients = set()  # Reset if not resuming
            self.current_batch = 0
        
        total_to_process = len(df_to_process)
        
        for start_idx in range(0, total_to_process, self.batch_size):
            end_idx = min(start_idx + self.batch_size, total_to_process)
            batch = df_to_process.iloc[start_idx:end_idx]
            
            logger.info(f"Processing batch {self.current_batch + 1}: clients {start_idx + 1}-{end_idx} of {total_to_process}")
            
            # Process the batch
            batch_results = process_function(batch, *args, **kwargs)
            results.extend(batch_results)
            
            # Update processed clients
            self.processed_clients.update(batch['REF_PERSONNE'].tolist())
            self.current_batch += 1
            
            logger.info(f"Completed batch {self.current_batch}. Total processed: {len(self.processed_clients)}")
        
        # Reset resume mode after completion
        self.resume_mode = False
        
        return results
    
    def get_remaining_clients(self, df_scored):
        """Get clients that haven't been processed yet"""
        return df_scored[~df_scored['REF_PERSONNE'].isin(self.processed_clients)]
    
    def set_resume_mode(self, resume=True):
        """Set resume mode to continue from last processed batch"""
        self.resume_mode = resume
        logger.info(f"Resume mode set to: {resume}")
    
    def reset(self):
        """Reset the batch processor"""
        self.current_batch = 0
        self.processed_clients = set()
        self.resume_mode = False
        logger.info("Batch processor reset")

# Global batch processor instance
batch_processor = BatchProcessor(batch_size=ALERT_CONFIG['batch_size'])