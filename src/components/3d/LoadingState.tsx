/**
 * Loading state component for 3D visualization
 * Displays while spatial positions are being computed
 */
export default function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-40">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
        <p className="text-white text-xl font-medium">Loading 3D Visualization...</p>
      </div>
    </div>
  );
}
