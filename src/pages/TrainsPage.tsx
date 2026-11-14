import React from 'react';
import { motion } from 'framer-motion';
import TrainFamilies from '../components/home/TrainFamilies';

/** Página dedicada a explicar las familias de trenes (también se muestra en la home) */
const TrainsPage: React.FC = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-12">
    <TrainFamilies />
  </motion.div>
);

export default TrainsPage;
