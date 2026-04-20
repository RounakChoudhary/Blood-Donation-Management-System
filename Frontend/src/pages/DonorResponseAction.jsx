import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import { API_BASE_URL } from '../services/apiBaseUrl';

function useQueryToken() {
  const location = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token');
  }, [location.search]);
}

export default function DonorResponseAction({ action = 'accept' }) {
  const token = useQueryToken();
  const normalizedAction = action === 'decline' ? 'decline' : 'accept';
  const [state, setState] = useState({
    loading: true,
    success: false,
    message: '',
  });

  useEffect(() => {
    let isCancelled = false;

    const submitResponse = async () => {
      if (!API_BASE_URL) {
        if (!isCancelled) {
          setState({
            loading: false,
            success: false,
            message: 'Frontend API base URL is not configured.',
          });
        }
        return;
      }

      if (!token) {
        if (!isCancelled) {
          setState({
            loading: false,
            success: false,
            message: 'This donor response link is missing its token.',
          });
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/donor-requests/respond/${normalizedAction}?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        let payload = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!isCancelled) {
          if (response.ok) {
            setState({
              loading: false,
              success: true,
              message: payload?.message || `Request ${normalizedAction === 'accept' ? 'accepted' : 'declined'} successfully.`,
            });
          } else {
            setState({
              loading: false,
              success: false,
              message: payload?.error || `Unable to ${normalizedAction} this request right now.`,
            });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            loading: false,
            success: false,
            message: error.message || 'Something went wrong while processing this donor response.',
          });
        }
      }
    };

    submitResponse();

    return () => {
      isCancelled = true;
    };
  }, [normalizedAction, token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-slate-200 p-8 text-center space-y-5">
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${state.loading ? 'bg-slate-100 text-slate-500' : state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {state.loading ? '…' : state.success ? 'OK' : '!'}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {state.loading
              ? 'Processing donor response'
              : state.success
                ? `Request ${normalizedAction === 'accept' ? 'accepted' : 'declined'}`
                : 'Response could not be completed'}
          </h1>
          <p className="text-sm font-medium text-slate-600">
            {state.loading
              ? 'Please wait while we verify your secure email link.'
              : state.message}
          </p>
        </div>

        {state.loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
          </div>
        )}

        {!state.loading && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Open Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
