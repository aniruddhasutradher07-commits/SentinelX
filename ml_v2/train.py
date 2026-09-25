import sys

def train_model(data_path, target_name, model_name, train_start, train_end, val_start, val_end, test_start, test_end, dry_run=True):
    print(f"Initializing training pipeline...")
    print(f"Dataset Provenance: {data_path}")
    
    if not dry_run:
        raise NotImplementedError("Real training is blocked until real dataset is finalized.")
        
    print("DRY RUN ONLY. No models were fitted.")
    print("No synthetic datasets were generated.")

if __name__ == "__main__":
    train_model("test.csv", "test", "rf", "2021", "2022", "2022", "2023", "2023", "2024", dry_run=True)
