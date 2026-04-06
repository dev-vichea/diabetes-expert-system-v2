import React, { useCallback, useMemo, useState, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Zap, Beaker, CheckCircle2, AlertTriangle, Layers, Target } from 'lucide-react'

// Custom Node for displaying a Condition
function ConditionNode({ data }) {
  const isOr = data.logical_operator?.toLowerCase() === 'or'
  
  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-lg w-[280px] bg-white dark:bg-[#0c1024] 
      ${isOr ? 'border-amber-400/50 shadow-amber-500/10' : 'border-cyan-400/50 shadow-cyan-500/10'}
      transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
          ${isOr ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30'}
        `}>
          <Target className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {data.index === 0 ? 'IF' : data.logical_operator?.toUpperCase()} Condition
          </p>
          <div className="font-mono text-sm mt-1 text-slate-800 dark:text-slate-200 font-semibold truncate" title={data.fact_key}>
            {data.fact_key || 'Unknown Fact'}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
              {data.operator || '=='}
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-mono truncate" title={String(data.expected_value)}>
              {String(data.expected_value ?? 'NULL')}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
    </div>
  )
}

// Custom Node for the Conclusion
function ConclusionNode({ data }) {
  return (
    <div className="px-5 py-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20 w-[300px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-800" />
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-inner">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            Conclusion
          </p>
          <p className="font-bold text-slate-900 dark:text-white truncate" title={data.conclusion}>
            {data.conclusion || 'No conclusion defined'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            CF: {data.certainty_factor} | {data.category}
          </p>
        </div>
      </div>
    </div>
  )
}

// Custom Node for the Rule Entry
function StartNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl border-2 border-slate-800 bg-slate-900 text-white shadow-xl shadow-slate-900/20 w-[240px]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Evaluate Rule</p>
          <p className="font-semibold truncate" title={data.name}>{data.name || 'Unnamed Rule'}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-slate-700 bg-slate-800" />
    </div>
  )
}

const nodeTypes = {
  condition: ConditionNode,
  conclusion: ConclusionNode,
  start: StartNode
}

export function VisualLogicMap({ form }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!form) return

    const newNodes = []
    const newEdges = []
    
    // Start node
    newNodes.push({
      id: 'start',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { name: form.name }
    })

    let previousNodeId = 'start'
    let currentY = 180

    // Condition nodes
    const conditions = form.conditions || []
    
    conditions.forEach((cond, index) => {
      const nodeId = `cond-${index}`
      
      // Determine X alignment based on AND/OR logic
      const isOr = cond.logical_operator === 'or' && index > 0
      const xPos = isOr ? 400 : 250 // offset OR conditions slightly

      newNodes.push({
        id: nodeId,
        type: 'condition',
        position: { x: xPos, y: currentY },
        data: {
          ...cond,
          index
        }
      })

      // Link to previous node
      newEdges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        animated: true,
        style: { stroke: isOr ? '#fbbf24' : '#06b6d4', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isOr ? '#fbbf24' : '#06b6d4' }
      })

      previousNodeId = nodeId
      currentY += 140
    })

    // Conclusion node
    const conclusionId = 'conclusion'
    newNodes.push({
      id: conclusionId,
      type: 'conclusion',
      position: { x: 240, y: currentY + 40 },
      data: {
        conclusion: form.conclusion,
        category: form.category,
        certainty_factor: form.certainty_factor
      }
    })

    newEdges.push({
      id: `edge-${previousNodeId}-${conclusionId}`,
      source: previousNodeId,
      target: conclusionId,
      animated: true,
      style: { stroke: '#10b981', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [form, setNodes, setEdges])

  return (
    <div className="w-full h-full min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#050816] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="dark:bg-[#050816]"
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls className="bg-white dark:bg-slate-900 border-none shadow-lg fill-slate-700 dark:fill-slate-300" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'start') return '#0f172a'
            if (n.type === 'conclusion') return '#10b981'
            if (n.data?.logical_operator === 'or') return '#f59e0b'
            return '#06b6d4'
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="bg-white dark:bg-slate-900 border-none rounded-lg shadow-lg overflow-hidden"
        />
      </ReactFlow>
      <div className="absolute top-4 left-4 pointer-events-none">
        <h3 className="section-title text-sm tracking-widest text-slate-400">VISUAL LOGIC BUILDER</h3>
      </div>
    </div>
  )
}
