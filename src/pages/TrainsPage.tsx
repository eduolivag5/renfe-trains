import React from 'react';
import { motion } from 'framer-motion';
import TrainFamilies from '../components/home/TrainFamilies';
import TrainFaq from '../components/trains/TrainFaq';

/**
 * Página dedicada a las familias de trenes.
 * TrainFamilies también se muestra en la home; las preguntas frecuentes solo aquí.
 */
const TrainsPage: React.FC = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-32 pb-12">
    <TrainFamilies />
    <TrainFaq />
  </motion.div>
);

export default TrainsPage;
