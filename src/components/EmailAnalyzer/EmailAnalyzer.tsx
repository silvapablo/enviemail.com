import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, AlertTriangle, CheckCircle, Clock, BarChart3, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useEmailAI } from '../../hooks/useEmailAI';
import { EmailAnalysisResult, EmailMetadata } from '../../services/openaiService';

interface EmailAnalyzerProps {
  emailContent: string;
  metadata?: EmailMetadata;
  onAnalysisComplete?: (result: EmailAnalysisResult) => void;
  autoAnalyze?: boolean;
  showHistory?: boolean;
}

export const EmailAnalyzer: React.FC<EmailAnalyzerProps> = ({ 
  emailContent, 
  metadata, 
  onAnalysisComplete,
  autoAnalyze = true,
  showHistory = true
}) => {
  const { 
    analyzeEmail, 
    isAnalyzing, 
    lastAnalysis, 
    error, 
    analysisHistory,
    usageStats,
    clearHistory,
    retryLastAnalysis
  } = useEmailAI();
  
  const [showUsageStats, setShowUsageStats] = useState(false);

  useEffect(() => {
    if (autoAnalyze && emailContent.trim() && emailContent.length > 10) {
      handleAnalysis();
    }
  }, [emailContent, metadata, autoAnalyze]);

  const handleAnalysis = useCallback(async () => {
    try {
      const result = await analyzeEmail(emailContent, metadata);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  }, [analyzeEmail, emailContent, metadata, onAnalysisComplete]);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'LEGITIMATE': return 'text-green-400';
      case 'SPAM': return 'text-red-400';
      case 'SUSPICIOUS': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getClassificationBg = (classification: string) => {
    switch (classification) {
      case 'LEGITIMATE': return 'bg-green-900/20 border-green-800';
      case 'SPAM': return 'bg-red-900/20 border-red-800';
      case 'SUSPICIOUS': return 'bg-yellow-900/20 border-yellow-800';
      default: return 'bg-gray-900/20 border-gray-800';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'LEGITIMATE': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'SPAM': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'SUSPICIOUS': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default: return <Brain className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'success';
    if (riskScore < 70) return 'warning';
    return 'error';
  };

  const formatAnalysisTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">AI Email Analysis</h3>
              <p className="text-gray-400 text-sm">Powered by GPT-4</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowUsageStats(!showUsageStats)}
              variant="ghost"
              size="sm"
              className="text-gray-400"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleAnalysis}
              disabled={isAnalyzing || !emailContent.trim()}
              size="sm"
              className="flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Analyze</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Usage Stats */}
        {showUsageStats && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Usage Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-white font-medium">{usageStats.tokenUsageToday || 0}</div>
                <div className="text-gray-400">Tokens Today</div>
              </div>
              <div>
                <div className="text-white font-medium">{usageStats.requestsLastHour || 0}</div>
                <div className="text-gray-400">Requests/Hour</div>
              </div>
              <div>
                <div className="text-white font-medium">{usageStats.cacheSize || 0}</div>
                <div className="text-gray-400">Cache Size</div>
              </div>
              <div>
                <div className="text-white font-medium">{analysisHistory.length}</div>
                <div className="text-gray-400">Analyses</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex items-center justify-center space-x-3 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <div className="text-center">
              <p className="text-white font-medium">AI is analyzing the email...</p>
              <p className="text-gray-400 text-sm">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Analysis Failed</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
              <Button
                onClick={retryLastAnalysis}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-400 hover:bg-red-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {lastAnalysis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Main Classification */}
            <div className={`rounded-lg p-6 border ${getClassificationBg(lastAnalysis.classification)}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getClassificationIcon(lastAnalysis.classification)}
                  <div>
                    <h4 className="text-xl font-bold text-white">{lastAnalysis.classification}</h4>
                    <p className="text-gray-400">AI Classification</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{lastAnalysis.confidence}%</div>
                  <div className="text-gray-400 text-sm">Confidence</div>
                </div>
              </div>

              <ProgressBar
                value={lastAnalysis.confidence}
                max={100}
                color={lastAnalysis.confidence > 80 ? 'success' : lastAnalysis.confidence > 60 ? 'warning' : 'error'}
                className="mb-4"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Model: {lastAnalysis.aiModel}</span>
                <span className="text-gray-400">
                  Analysis time: {formatAnalysisTime(lastAnalysis.analysisTime)}
                </span>
              </div>
            </div>

            {/* Risk Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50">
                <h4 className="text-lg font-semibold text-white mb-4">Risk Assessment</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk Score</span>
                    <span className="text-white font-bold">{lastAnalysis.riskScore}/100</span>
                  </div>
                  <ProgressBar
                    value={lastAnalysis.riskScore}
                    max={100}
                    color={getRiskColor(lastAnalysis.riskScore)}
                  />
                  <div className="text-sm text-gray-400">
                    {lastAnalysis.riskScore < 30 && 'Low risk - likely safe'}
                    {lastAnalysis.riskScore >= 30 && lastAnalysis.riskScore < 70 && 'Medium risk - review recommended'}
                    {lastAnalysis.riskScore >= 70 && 'High risk - caution advised'}
                  </div>
                </div>
              </Card>

              <Card className="bg-gray-800/50">
                <h4 className="text-lg font-semibold text-white mb-4">Recommended Action</h4>
                <div className="text-center">
                  <Badge
                    variant={
                      lastAnalysis.recommendedAction === 'APPROVE' ? 'success' :
                      lastAnalysis.recommendedAction === 'REJECT' ? 'error' : 'warning'
                    }
                    className="text-lg px-4 py-2"
                  >
                    {lastAnalysis.recommendedAction.replace('_', ' ')}
                  </Badge>
                  <p className="text-gray-400 text-sm mt-2">
                    {lastAnalysis.recommendedAction === 'APPROVE' && 'Email appears legitimate and safe'}
                    {lastAnalysis.recommendedAction === 'REJECT' && 'Email should be blocked or flagged'}
                    {lastAnalysis.recommendedAction === 'HUMAN_REVIEW' && 'Manual review recommended'}
                  </p>
                </div>
              </Card>
            </div>

            {/* Analysis Reasons */}
            <Card className="bg-gray-800/50">
              <h4 className="text-lg font-semibold text-white mb-4">Analysis Details</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Key Findings</h5>
                  <ul className="space-y-2">
                    {lastAnalysis.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span className="text-gray-300">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {lastAnalysis.detectedPatterns.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Detected Patterns</h5>
                    <div className="flex flex-wrap gap-2">
                      {lastAnalysis.detectedPatterns.map((pattern, index) => (
                        <Badge
                          key={index}
                          variant="warning"
                          size="sm"
                          className="text-xs"
                        >
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lastAnalysis.tokenUsage && (
                  <div className="pt-3 border-t border-gray-700">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Token Usage</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-white">{lastAnalysis.tokenUsage.prompt}</div>
                        <div className="text-gray-400">Prompt</div>
                      </div>
                      <div>
                        <div className="text-white">{lastAnalysis.tokenUsage.completion}</div>
                        <div className="text-gray-400">Completion</div>
                      </div>
                      <div>
                        <div className="text-white">{lastAnalysis.tokenUsage.total}</div>
                        <div className="text-gray-400">Total</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Analysis History */}
      {showHistory && analysisHistory.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Recent Analyses</h4>
            <Button
              onClick={clearHistory}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {analysisHistory.slice(0, 10).map((analysis, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getClassificationIcon(analysis.classification)}
                  <div>
                    <span className={`font-medium ${getClassificationColor(analysis.classification)}`}>
                      {analysis.classification}
                    </span>
                    <div className="text-xs text-gray-400">
                      {analysis.aiModel} • {formatAnalysisTime(analysis.analysisTime)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{analysis.confidence}%</div>
                  <div className="text-xs text-gray-400">confidence</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};