'use client';

import { useState } from 'react';

interface APIClientProps {
  route: string;
  initialMethods: string[];
}

export default function APIClient({ route, initialMethods }: APIClientProps) {
  const [selectedMethod, setSelectedMethod] = useState(initialMethods[0] || 'GET');
  const [url, setUrl] = useState(`http://localhost:3000/api${route}`);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);
    
    const startTime = Date.now();
    
    try {
      const fetchOptions: RequestInit = {
        method: selectedMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      };
      
      // 如果有请求体且不是GET/HEAD请求，则添加请求体
      if (requestBody && !['GET', 'HEAD'].includes(selectedMethod)) {
        try {
          // 验证JSON格式
          JSON.parse(requestBody);
          fetchOptions.body = requestBody;
        } catch (jsonError) {
          setError('请求体必须是有效的JSON格式');
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch(url, fetchOptions);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatusCode(response.status);
      
      // 尝试解析JSON响应
      try {
        const data = await response.json();
        setResponse(JSON.stringify(data, null, 2));
      } catch {
        // 如果不是JSON，获取文本响应
        const text = await response.text();
        setResponse(text || '无响应内容');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">测试接口</h4>
          {responseTime && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              响应时间: {responseTime}ms
              {statusCode && ` | 状态码: ${statusCode}`}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {initialMethods.map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors ${getMethodColorClass(method, selectedMethod === method)}`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              placeholder="API URL"
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-2 rounded font-medium transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading ? '发送中...' : '发送请求'}
            </button>
          </div>
        </div>

        {/* 仅在非GET/HEAD请求时显示请求体输入框 */}
        {!['GET', 'HEAD'].includes(selectedMethod) && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">请求体 (JSON)</label>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder={`{\n  "key": "value"\n}`}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white h-32 font-mono text-sm"
            />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 响应显示区域 */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">响应</h4>
          <div className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded bg-zinc-50 dark:bg-zinc-950 h-60 overflow-auto">
            {response ? (
              <pre className="text-sm text-zinc-800 dark:text-zinc-200 font-mono">{response}</pre>
            ) : (
              <pre className="text-sm text-zinc-500 dark:text-zinc-500">// 响应将显示在这里</pre>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * 获取请求方法对应的样式类
 */
function getMethodColorClass(method: string, isActive: boolean): string {
  const baseClasses = 'transition-colors';
  const activeClasses = 'ring-2 ring-offset-1 ring-blue-500';
  
  const methodMap: Record<string, string> = {
    'GET': `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`,
    'POST': `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`,
    'PUT': `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`,
    'DELETE': `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`,
    'PATCH': `bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400`,
    'OPTIONS': `bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`,
    'HEAD': `bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400`,
  };
  
  return `${methodMap[method] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'} ${baseClasses} ${isActive ? activeClasses : ''}`;
}