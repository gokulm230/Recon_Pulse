import React, { useMemo, useState } from 'react';

// Extracted outside to prevent re-mounting and losing input focus on state updates
const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white border border-gray-200 rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] ${className}`}
  >
    {children}
  </div>
);

const SectionHeader = ({
  icon,
  title,
  description,
  count,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>

        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>

    {count !== undefined && (
      <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
        {count}
      </span>
    )}
  </div>
);

function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE =
    import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleScan = async (e) => {
    e.preventDefault();

    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_url: targetUrl.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          'Scan failed. Ensure the target is reachable and the backend is running.'
        );
      }

      const data = await response.json();
      setScanResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!scanResult) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/report/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanResult),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF report.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'reconpulse_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const findings = scanResult?.findings || [];
  const missingHeaders = scanResult?.missing_headers || [];
  const exposedEndpoints = scanResult?.exposed_endpoints || [];

  const severityCounts = useMemo(() => {
    return {
      critical: findings.filter(
        (item) => item.severity?.toLowerCase() === 'critical'
      ).length,

      high: findings.filter(
        (item) => item.severity?.toLowerCase() === 'high'
      ).length,

      medium: findings.filter(
        (item) => item.severity?.toLowerCase() === 'medium'
      ).length,

      low: findings.filter(
        (item) => item.severity?.toLowerCase() === 'low'
      ).length,
    };
  }, [findings]);

  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          label: 'Critical',
          className:
            'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
        };

      case 'high':
        return {
          label: 'High',
          className:
            'bg-orange-50 text-orange-700 border-orange-200',
          dot: 'bg-orange-500',
        };

      case 'medium':
        return {
          label: 'Medium',
          className:
            'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };

      case 'low':
        return {
          label: 'Low',
          className:
            'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };

      default:
        return {
          label: severity || 'Info',
          className:
            'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h4l2-7 4 14 2-7h6" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-gray-950">
                    ReconPulse
                  </h1>

                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold uppercase tracking-wide">
                    Security
                  </span>
                </div>

                <p className="hidden md:block text-[11px] text-gray-500 mt-0.5">
                  Reconnaissance & vulnerability intelligence
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3">
              {scanResult && (
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>

                  <span className="hidden sm:inline">
                    Export report
                  </span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Scanner ready
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <section className="mb-7">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
              Web Security Assessment
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950">
              Scan, analyze and understand your attack surface.
            </h2>

            <p className="mt-2 text-sm text-gray-500 max-w-2xl leading-6">
              Run reconnaissance against an authorized target to identify
              security headers, exposed endpoints and potential
              vulnerabilities.
            </p>
          </div>
        </section>

        {/* Scan box */}
        <Card className="p-5 mb-7">
          <form onSubmit={handleScan}>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>

                <input
                  type="text"
                  placeholder="https://example.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3z"
                      />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v4" />
                      <path d="M12 17v4" />
                      <path d="M3 12h4" />
                      <path d="M17 12h4" />
                      <path d="m5.6 5.6 2.8 2.8" />
                      <path d="m15.6 15.6 2.8 2.8" />
                      <path d="m5.6 18.4 2.8-2.8" />
                      <path d="m15.6 8.4 2.8-2.8" />
                    </svg>
                    Start security scan
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                HTTP security headers
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Endpoint discovery
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Vulnerability assessment
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI remediation
              </span>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Scan failed
                  </p>

                  <p className="text-xs text-red-700 mt-0.5">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Empty state */}
        {!scanResult && !loading && !error && (
          <Card className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>

            <h3 className="text-base font-semibold text-gray-900">
              Ready for your first scan
            </h3>

            <p className="mt-1.5 text-sm text-gray-500 max-w-md mx-auto">
              Enter an authorized target above to begin reconnaissance and
              security analysis.
            </p>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <Card className="p-8">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 animate-spin text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="opacity-20"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Running security assessment
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Enumerating headers, endpoints and potential findings...
                </p>

                <div className="mt-4 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-2/3 bg-indigo-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {scanResult && !loading && (
          <div className="space-y-6">
            {/* Scan summary */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                  Findings
                </p>

                <p className="text-2xl font-bold text-gray-950 mt-2">
                  {findings.length}
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  Total issues
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                  Critical
                </p>

                <p className="text-2xl font-bold text-red-600 mt-2">
                  {severityCounts.critical}
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  Immediate attention
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                  High
                </p>

                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {severityCounts.high}
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  High priority
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                  Headers
                </p>

                <p className="text-2xl font-bold text-amber-600 mt-2">
                  {missingHeaders.length}
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  Missing headers
                </p>
              </Card>

              <Card className="p-4 col-span-2 lg:col-span-1">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
                  Endpoints
                </p>

                <p className="text-2xl font-bold text-indigo-600 mt-2">
                  {exposedEndpoints.length}
                </p>

                <p className="text-[11px] text-gray-500 mt-1">
                  Discovered
                </p>
              </Card>
            </div>

            {/* Target information */}
            <Card className="px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                    Scan target
                  </p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                    <code className="text-sm font-mono text-gray-800 break-all">
                      {targetUrl}
                    </code>
                  </div>
                </div>

                <span className="inline-flex items-center self-start sm:self-auto gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Scan completed
                </span>
              </div>
            </Card>

            {/* Security overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Missing headers */}
              <Card className="p-5">
                <SectionHeader
                  title="Security headers"
                  description="HTTP response headers that were not detected."
                  count={missingHeaders.length}
                  icon={
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  }
                />

                <div className="mt-5">
                  {missingHeaders.length === 0 ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>

                        <p className="text-sm font-semibold text-emerald-800">
                          Security headers look good
                        </p>
                      </div>

                      <p className="text-xs text-emerald-700 mt-1 ml-7">
                        All standard headers checked by the scanner were found.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {missingHeaders.map((header, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {header}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Endpoints */}
              <Card className="p-5">
                <SectionHeader
                  title="Discovered endpoints"
                  description="Potentially interesting paths identified during reconnaissance."
                  count={exposedEndpoints.length}
                  icon={
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 6h16" />
                      <path d="M4 12h16" />
                      <path d="M4 18h10" />
                    </svg>
                  }
                />

                <div className="mt-5">
                  {exposedEndpoints.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3">
                      No common sensitive endpoints were exposed.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {exposedEndpoints.map((ep, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
                        >
                          <code className="text-xs font-mono text-gray-700 truncate">
                            {ep.endpoint}
                          </code>

                          <span
                            className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold border ${
                              ep.status_code === 200
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {ep.status_code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Findings */}
            <Card className="overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Vulnerability findings
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Security issues identified during the assessment.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-gray-500">
                    {findings.length} result
                    {findings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {findings.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    No critical vulnerabilities identified
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    The scanner did not detect any findings requiring attention.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200">
                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Severity
                        </th>

                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Category
                        </th>

                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                          Finding
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {findings.map((finding, index) => {
                        const severity = getSeverityConfig(
                          finding.severity
                        );

                        return (
                          <tr
                            key={index}
                            className="hover:bg-gray-50/70 transition"
                          >
                            <td className="px-6 py-4 align-top">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${severity.className}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${severity.dot}`}
                                />

                                {severity.label}
                              </span>
                            </td>

                            <td className="px-6 py-4 align-top">
                              <span className="text-xs font-semibold text-gray-700">
                                {finding.category}
                              </span>
                            </td>

                            <td className="px-6 py-4 align-top">
                              <p className="text-sm font-semibold text-gray-900">
                                {finding.issue}
                              </p>

                              <p className="text-xs text-gray-500 leading-5 mt-1 max-w-3xl">
                                {finding.details}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* AI Analysis */}
            <Card className="overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v3" />
                      <path d="M12 18v3" />
                      <path d="M3 12h3" />
                      <path d="M18 12h3" />
                      <path d="m5.6 5.6 2.1 2.1" />
                      <path d="m16.3 16.3 2.1 2.1" />
                      <path d="m5.6 18.4 2.1-2.1" />
                      <path d="m16.3 7.7 2.1-2.1" />
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      AI security analysis
                    </h3>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Gemini-powered impact assessment and remediation guidance
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="relative rounded-xl border border-gray-200 bg-[#fafbfc] overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />

                  <div className="px-5 py-5 pl-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />

                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                        AI generated assessment
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 leading-7 whitespace-pre-line">
                      {scanResult.ai_analysis || (
                        <span className="text-gray-400">
                          No AI analysis was returned by the scanner.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Footer note */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 py-2">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
              </svg>

              Only scan systems you own or have explicit authorization to test.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;