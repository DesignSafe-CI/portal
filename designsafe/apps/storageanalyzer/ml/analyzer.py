import os
import time
import hashlib
import numpy as np
from pathlib import Path
from datetime import datetime
from sklearn.ensemble import IsolationForest


def compute_hash(file_path):
    """Compute SHA256 hash of a file."""
    hasher = hashlib.sha256()
    try:
        with open(file_path, 'rb') as afile:
            while chunk := afile.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None


def extract_features(file_info):
    """Extract features for anomaly detection."""
    return [
        file_info['size'],       # in MB
        file_info['age_days'],   # days since last access
        file_info['depth'],      # path depth
    ]


def get_path_depth(path, base_dir):
    rel = os.path.relpath(path, base_dir)
    return len(Path(rel).parts)


def analyze_user_storage(user_dir):
    now = time.time()
    file_records = []
    feature_matrix = []
    seen_hashes = {}

    for root, dirs, files in os.walk(user_dir):
        for fname in files:
            fpath = os.path.join(root, fname)

            try:
                stat = os.stat(fpath)
            except Exception:
                continue

            size = stat.st_size / (1024 * 1024)  # MB
            age_days = (now - stat.st_atime) / (60 * 60 * 24)
            depth = get_path_depth(fpath, user_dir)

            file_info = {
                'path': fpath,
                'size': round(size, 2),
                'age_days': round(age_days),
                'last_accessed': datetime.utcfromtimestamp(stat.st_atime).isoformat(),
                'depth': depth,
            }

            # Hashing (only for smaller files)
            file_hash = compute_hash(fpath) if size < 500 else None
            file_info['hash'] = file_hash
            file_info['duplicate'] = False

            # Check for duplicates
            if file_hash:
                if file_hash in seen_hashes:
                    file_info['duplicate'] = True
                else:
                    seen_hashes[file_hash] = fpath

            file_records.append(file_info)
            feature_matrix.append(extract_features(file_info))

    # Run anomaly detection
    clf = IsolationForest(contamination=0.05, random_state=42)
    try:
        preds = clf.fit_predict(np.array(feature_matrix))
    except Exception:
        preds = [1] * len(file_records)  # fallback: all normal

    suggestions = []

    for idx, f in enumerate(file_records):
        score = 0
        reasons = []

        # Rule-based scoring
        if f['age_days'] > 180:
            score += 0.4
            reasons.append("Not accessed in 6+ months")

        if f['size'] > 100:
            score += 0.3
            reasons.append("Large file")

        if f['duplicate']:
            score += 0.5
            reasons.append("Duplicate file")

        # ML-based anomaly
        if preds[idx] == -1:
            score += 0.5
            reasons.append("Anomalous file (statistical outlier)")

        if score >= 0.5:
            suggestions.append({
                'path': f['path'],
                'last_accessed': f['last_accessed'],
                'size': f['size'],
                'reason': ", ".join(reasons),
            })

    return suggestions
