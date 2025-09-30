import { useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores';

interface NodeMapProps {
  className?: string;
}

/**
 * Interactive node map component for visualizing story structure
 * This is a placeholder implementation - will be enhanced with React Flow
 */
export default function NodeMap({ className = '' }: NodeMapProps) {
  const {
    nodes,
    selectedNode,
    hoveredNode,
    viewport,
    selectNode,
    setHoveredNode,
    openStoryView,
    updateViewport,
    getNodeState,
  } = useStoryStore();

  // Convert Map to array for easier iteration
  const nodeArray = useMemo(() => Array.from(nodes.values()), [nodes]);

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
      openStoryView(nodeId);
    },
    [selectNode, openStoryView]
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      setHoveredNode(nodeId);
    },
    [setHoveredNode]
  );

  // Handle viewport pan (placeholder)
  const handleViewportChange = useCallback(
    (deltaX: number, deltaY: number) => {
      updateViewport({
        center: {
          x: viewport.center.x + deltaX,
          y: viewport.center.y + deltaY,
        },
      });
    },
    [viewport.center, updateViewport]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return;

      switch (event.key) {
        case 'Escape':
          selectNode(null);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleViewportChange(-50, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleViewportChange(50, 0);
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleViewportChange(0, -50);
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleViewportChange(0, 50);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleViewportChange, selectNode]);

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden ${className}`}
      role="region"
      aria-label="Interactive story node map"
      aria-describedby="map-instructions"
    >
      {/* Instructions for screen readers */}
      <div id="map-instructions" className="sr-only">
        Interactive map showing story nodes. Use arrow keys to navigate the view.
        Click on nodes to read their content. Press Escape to deselect nodes.
      </div>

      {/* Map container */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${-viewport.center.x}px, ${-viewport.center.y}px) scale(${viewport.zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Placeholder grid for visual reference */}
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }}
          >
            <defs>
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Render nodes */}
        <AnimatePresence>
          {nodeArray.map((node) => {
            const nodeState = getNodeState(node.id);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute cursor-pointer"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => handleNodeHover(node.id)}
                onMouseLeave={() => handleNodeHover(null)}
              >
                {/* Node circle */}
                <div
                  className={`
                    relative w-16 h-16 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200
                    ${nodeState.visited ? 'border-gray-300' : 'border-gray-200'}
                    ${isSelected ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}
                    ${isHovered ? 'shadow-lg' : 'shadow'}
                    character-${node.character}
                  `}
                  style={{
                    backgroundColor: nodeState.visualProperties.color,
                    opacity: nodeState.visualProperties.opacity,
                  }}
                >
                  {/* Character indicator */}
                  <span className="text-white font-semibold text-sm">
                    {node.character[0].toUpperCase()}
                  </span>

                  {/* Visit indicator */}
                  {nodeState.visited && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {nodeState.visitCount}
                      </span>
                    </div>
                  )}

                  {/* Glow effect for selected */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-pulse" />
                  )}
                </div>

                {/* Node label */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-800 shadow-sm">
                    {node.title}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Placeholder message when no nodes */}
        {nodeArray.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121 3.382v10.764a1 1 0 01-.553.894L15 18l-6-3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Story Loaded
              </h3>
              <p className="text-gray-500 max-w-sm">
                Load a story to begin exploring the interactive narrative map.
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          type="button"
          className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
          onClick={() => updateViewport({ zoom: Math.min(viewport.zoom * 1.2, 3) })}
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button
          type="button"
          className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
          onClick={() => updateViewport({ zoom: Math.max(viewport.zoom / 1.2, 0.1) })}
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 12H6"
            />
          </svg>
        </button>
        <button
          type="button"
          className="btn-secondary w-10 h-10 p-0 flex items-center justify-center"
          onClick={() => updateViewport({ center: { x: 0, y: 0 }, zoom: 1 })}
          aria-label="Reset view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
          </svg>
        </button>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Nodes:</span> {nodeArray.length}
          {selectedNode && (
            <>
              <span className="mx-2">•</span>
              <span className="font-medium">Selected:</span> {selectedNode}
            </>
          )}
        </div>
      </div>
    </div>
  );
}