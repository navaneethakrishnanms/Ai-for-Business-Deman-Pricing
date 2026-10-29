"""Generate the synthetic sales log and print the calibration table. Run: python scripts/generate_data.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.synth.generate import simulate, calibration_table  # noqa: E402

if __name__ == "__main__":
    sales, items, tiers, truth = simulate()
    print(calibration_table(sales, truth).to_string(index=False))
    print(f"item-day rows {int((sales.combo == 'no').sum())}, combo rows {int((sales.combo == 'yes').sum())}")
    print("wrote data/synthetic/*.csv and grader_data/hidden_truth.json")
