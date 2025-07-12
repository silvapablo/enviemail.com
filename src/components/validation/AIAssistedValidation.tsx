import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmailAnalyzer } from '../EmailAnalyzer/EmailAnalyzer';
import { useEmailAI } from '../../hooks/useEmailAI';
import { EmailValidation } from '../../types';
import { EmailAnalysisResult } from '../../services/openaiService';

interface ValidationTaskWithAI extends EmailValidation {
  aiAnalysis?: EmailAnalysisResult;
  autoProcessed?: boolean;
}

interface AIAssistedValidationProps {
  validations: EmailValidation[];
  onValidate: (id: string, isLegitimate: boolean, metadata?: any) => void;
}

export const AIAssistedValidation: React.FC<AIAssistedValidationProps> = ({
  validations,
  onValidate
}) => {
  const [validationQueue, setValidationQueue] = useState<ValidationTaskWithAI[]>([]);
  const [currentTask, setCurrentTask] = useState<ValidationTaskWithAI | null>(null);
  const [autoProcessingEnabled, setAutoProcessingEnabled] = useState(true);
  const [processingStats, setProcessingStats] = useState({
    autoApproved: 0,
    autoRejected: 0,
    humanReview: 0,
    totalProcessed: 0
  });

  const { analyzeEmail, isAnalyzing } = useEmailAI();

  useEffect(() => {
    // Convert validations to tasks with AI analysis
    const tasks: ValidationTaskWithAI[] = validations.map(validation => ({
      ...validation,
      aiAnalysis: undefined,
      autoProcessed: false
    }));
    
    setValidationQueue(tasks);
    
    // Set current task to first pending validation
    const pendingTask = tasks.find(task => task.status === 'pending' && !task.aiAnalysis);
    if (pendingTask && !currentTask) {
      setCurrentTask(pendingTask);
    }
  }, [validations, currentTask]);

  const handleAIAnalysisComplete = async (taskId: string, analysis: EmailAnalysisResult) => {
    setValidationQueue(prev => prev.map(task => 
      task.id === taskId ? { ...task, aiAnalysis: analysis } : task
    ));

    // Auto-processing logic
    if (autoProcessingEnabled && analysis.confidence >= 90) {
      if (analysis.recommendedAction === 'APPROVE') {
        await handleAutoApprove(taskId, analysis);
      } else if (analysis.recommendedAction === 'REJECT') {
        await handleAutoReject(taskId, analysis);
      } else {
        // Mark for human review
        setValidationQueue(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'pending' as const } : task
        ));
        updateProcessingStats('humanReview');
      }
    } else {
      // Lower confidence - always require human review
      updateProcessingStats('humanReview');
    }

    // Move to next task
    moveToNextTask();
  };

  const handleAutoApprove = async (taskId: string, analysis: EmailAnalysisResult) => {
    try {
      await onValidate(taskId, true, {
        source: 'AI_AUTO_APPROVAL',
        confidence: analysis.confidence,
        reasons: analysis.reasons,
        aiModel: analysis.aiModel,
        riskScore: analysis.riskScore
      });

      setValidationQueue(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'validated' as const, 
          autoProcessed: true 
        } : task
      ));

      updateProcessingStats('autoApproved');
      console.log(`✅ Auto-approved email ${taskId} with ${analysis.confidence}% confidence`);
    } catch (error) {
      console.error('Auto-approval failed:', error);
    }
  };

  const handleAutoReject = async (taskId: string, analysis: EmailAnalysisResult) => {
    try {
      await onValidate(taskId, false, {
        source: 'AI_AUTO_REJECTION',
        confidence: analysis.confidence,
        reasons: analysis.reasons,
        aiModel: analysis.aiModel,
        riskScore: analysis.riskScore
      });

      setValidationQueue(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'rejected' as const, 
          autoProcessed: true 
        } : task
      ));

      updateProcessingStats('autoRejected');
      console.log(`❌ Auto-rejected email ${taskId} with ${analysis.confidence}% confidence`);
    } catch (error) {
      console.error('Auto-rejection failed:', error);
    }
  };

  const handleHumanValidation = async (taskId: string, isLegitimate: boolean) => {
    try {
      const task = validationQueue.find(t => t.id === taskId);
      await onValidate(taskId, isLegitimate, {
        source: 'HUMAN_VALIDATION',
        aiAnalysis: task?.aiAnalysis,
        humanOverride: task?.aiAnalysis ? 
          (isLegitimate !== (task.aiAnalysis.recommendedAction === 'APPROVE')) : false
      });

      setValidationQueue(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: isLegitimate ? 'validated' as const : 'rejected' as const 
        } : task
      ));

      updateProcessingStats('humanReview');
      moveToNextTask();
    } catch (error) {
      console.error('Human validation failed:', error);
    }
  };

  const moveToNextTask = () => {
    const nextTask = validationQueue.find(task => 
      task.status === 'pending' && !task.aiAnalysis && task.id !== currentTask?.id
    );
    setCurrentTask(nextTask || null);
  };

  const updateProcessingStats = (type: 'autoApproved' | 'autoRejected' | 'humanReview') => {
    setProcessingStats(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      totalProcessed: prev.totalProcessed + 1
    }));
  };

  const getTaskStatusIcon = (task: ValidationTaskWithAI) => {
    if (task.autoProcessed) {
      return task.status === 'validated' ? 
        <CheckCircle className="h-4 w-4 text-green-400" /> :
        <XCircle className="h-4 w-4 text-red-400" />;
    }
    
    if (task.status === 'validated') return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (task.status === 'rejected') return <XCircle className="h-4 w-4 text-red-400" />;
    if (task.aiAnalysis) return <Brain className="h-4 w-4 text-yellow-400" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getTaskStatusText = (task: ValidationTaskWithAI) => {
    if (task.autoProcessed) {
      return task.status === 'validated' ? 'Auto-Approved' : 'Auto-Rejected';
    }
    
    if (task.status === 'validated') return 'Approved';
    if (task.status === 'rejected') return 'Rejected';
    if (task.aiAnalysis) return 'AI Analyzed';
    return 'Pending';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-yellow-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">AI-Assisted Validation</h2>
              <p className="text-gray-400">Powered by GPT-4 for intelligent email analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoProcessingEnabled}
                onChange={(e) => setAutoProcessingEnabled(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
              <span className="text-gray-300 text-sm">Auto-process high confidence</span>
            </label>
          </div>
        </div>

        {/* Processing Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{processingStats.autoApproved}</div>
            <div className="text-sm text-gray-400">Auto-Approved</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{processingStats.autoRejected}</div>
            <div className="text-sm text-gray-400">Auto-Rejected</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{processingStats.humanReview}</div>
            <div className="text-sm text-gray-400">Human Review</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-white">{processingStats.totalProcessed}</div>
            <div className="text-sm text-gray-400">Total Processed</div>
          </div>
        </div>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Current Validation Task</h3>
            <Badge variant="warning">
              <Clock className="h-4 w-4 mr-1" />
              Pending Analysis
            </Badge>
          </div>

          <div className="space-y-6">
            {/* Email Content */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">Email Content</h4>
                <div className="text-sm text-gray-400">
                  From: {currentTask.sender.slice(0, 10)}...{currentTask.sender.slice(-8)}
                </div>
              </div>
              <div className="mb-3">
                <h5 className="text-lg font-medium text-white">{currentTask.subject}</h5>
              </div>
              <div className="bg-gray-900/50 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {currentTask.content}
                </pre>
              </div>
            </div>

            {/* AI Analysis */}
            <EmailAnalyzer
              emailContent={currentTask.content}
              metadata={{
                from: currentTask.sender,
                subject: currentTask.subject,
                domain: currentTask.sender.split('@')[1] || 'unknown',
                timestamp: new Date(currentTask.timestamp).getTime(),
                targetAudience: currentTask.targetAudience
              }}
              onAnalysisComplete={(analysis) => 
                handleAIAnalysisComplete(currentTask.id, analysis)
              }
              autoAnalyze={true}
              showHistory={false}
            />

            {/* AI Recommendation */}
            {currentTask.aiAnalysis && (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <h4 className="font-medium text-blue-400">AI Recommendation</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-300">
                    <strong>Action:</strong> {currentTask.aiAnalysis.recommendedAction.replace('_', ' ')}
                    {' '}with <strong>{currentTask.aiAnalysis.confidence}%</strong> confidence
                  </p>
                  <p className="text-blue-300">
                    <strong>Classification:</strong> {currentTask.aiAnalysis.classification}
                  </p>
                  {currentTask.aiAnalysis.confidence >= 90 && autoProcessingEnabled && (
                    <div className="flex items-center space-x-2 mt-3">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        High confidence - will be auto-processed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Human Decision Buttons */}
            {currentTask.aiAnalysis && !isAnalyzing && (
              <div className="flex space-x-4">
                <Button
                  onClick={() => handleHumanValidation(currentTask.id, true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 font-medium"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve as Legitimate
                </Button>
                <Button
                  onClick={() => handleHumanValidation(currentTask.id, false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-medium"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject as Spam
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Validation Queue */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Validation Queue</h3>
          <Badge variant="info">
            {validationQueue.filter(t => t.status === 'pending').length} Pending
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {validationQueue.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-all ${
                task.id === currentTask?.id 
                  ? 'border-yellow-400 bg-yellow-900/10' 
                  : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTaskStatusIcon(task)}
                  <div>
                    <h4 className="font-medium text-white">{task.subject}</h4>
                    <p className="text-sm text-gray-400">
                      {task.targetAudience.toLocaleString()} recipients
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      task.status === 'validated' ? 'success' :
                      task.status === 'rejected' ? 'error' : 'warning'
                    }
                    size="sm"
                  >
                    {getTaskStatusText(task)}
                  </Badge>
                  {task.aiAnalysis && (
                    <div className="text-xs text-gray-400 mt-1">
                      {task.aiAnalysis.confidence}% confidence
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};