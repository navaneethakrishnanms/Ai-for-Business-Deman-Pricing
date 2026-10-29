"""Penalised logistic regression on aggregated counts (IRLS)."""
import numpy as np


def _solve(A, b):
    try:
        return np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        return np.linalg.lstsq(A, b, rcond=None)[0]


def fit_binomial(X, successes, trials, penalty, iters=60, tol=1e-9):
    """Ridge-penalised logistic regression. Returns (beta, covariance)."""
    P = np.diag(penalty)
    p = (successes + 0.5) / (trials + 1.0)
    eta = np.log(p / (1 - p))
    beta = np.zeros(X.shape[1])
    for _ in range(iters):
        W = trials * p * (1 - p)
        z = eta + (successes - trials * p) / np.maximum(W, 1e-9)
        new = _solve(X.T @ (X * W[:, None]) + P, X.T @ (W * z))
        eta = np.clip(X @ new, -15, 15)
        p = 1 / (1 + np.exp(-eta))
        done = np.max(np.abs(new - beta)) < tol
        beta = new
        if done:
            break
    W = trials * p * (1 - p)
    cov = np.linalg.pinv(X.T @ (X * W[:, None]) + P)
    return beta, cov
