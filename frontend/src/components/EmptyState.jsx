import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EmptyStateIcon } from './Icons';

function EmptyState({ 
  title = 'Aucun élément trouvé', 
  message = 'Aucun contenu disponible pour le moment.',
  actionLabel,
  actionPath 
}) {
  return (
    <div className="text-center py-20">
      <div className="mb-6 flex justify-center">
        <div className="p-4 bg-surface-100 rounded-full">
          <EmptyStateIcon className="w-12 h-12 text-surface-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-surface-900 mb-2">{title}</h3>
      <p className="text-surface-600 mb-6 max-w-md mx-auto">{message}</p>
      {actionLabel && actionPath && (
        <Link to={actionPath} className="btn-primary inline-block">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export default EmptyState;

