// components/map/MapIcons.ts
import { COLORS } from './MapConstants';

export function createTrainIcon(fillColor: string, logicalSize = 52): ImageData {
  const ratio = 2;
  const size = logicalSize * ratio;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);

  const s = logicalSize;
  const cx = s / 2;
  const cy = s / 2;
  const radius = (s / 2) - 3;

  // --- 1. Sombra exterior ---
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2.5;

  // --- 2. Círculo contenedor ---
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  // --- 3. Borde blanco grueso ---
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- 4. Icono SVG (Renderizado mediante Path2D) ---
  // Escalamos el icono para que quepa armoniosamente (aprox 60% del círculo)
  const iconScale = 0.055; 
  ctx.save();
  
  // Posicionamiento manual para centrar el path del SVG (que es de 512x512)
  ctx.translate(cx - (512 * iconScale) / 2, cy - (512 * iconScale) / 2);
  ctx.scale(iconScale, iconScale);
  
  // El Path exacto de tu SVG
  const p = new Path2D(
    "M431.665,356.848V147.207c0-48.019-38.916-86.944-86.943-86.944h-40.363l4.812-42.824h8.813 c9.435,0,17.508,5.74,20.965,13.898l16.06-6.779V24.55C348.929,10.124,334.641,0.018,317.984,0L193.999,0.009 c-16.639,0.009-30.928,10.116-37.016,24.541l16.06,6.796c3.466-8.166,11.539-13.906,20.956-13.897h8.823l4.81,42.815h-40.354 c-48.01,0-86.942,38.924-86.942,86.944v209.641c0,36.403,26.483,66.736,61.208,72.773L87.011,512h48.488l22.378-33.823h196.264 L376.519,512h48.47l-54.516-82.379C405.182,423.576,431.665,393.252,431.665,356.848z M291.621,17.44l-4.803,42.824h-61.635 l-4.819-42.815L291.621,17.44z M180.715,99.299h150.57v25.095h-150.57V99.299z M135.413,180.409 c0-10.917,8.839-19.773,19.756-19.773h201.664c10.916,0,19.773,8.856,19.773,19.773v65.96c0,10.917-8.857,19.764-19.773,19.764 H155.168c-10.916,0-19.756-8.847-19.756-19.764V180.409z M154.232,378.495c-12.739,0-23.06-10.321-23.06-23.043 c0-12.739,10.321-23.052,23.06-23.052c12.722,0,23.043,10.313,23.043,23.052C177.275,368.174,166.954,378.495,154.232,378.495z M172.421,456.19l16.844-25.461h133.471l16.844,25.461H172.421z M357.768,378.495c-12.722,0-23.043-10.321-23.043-23.043 c0-12.739,10.321-23.052,23.043-23.052c12.739,0,23.06,10.313,23.06,23.052C380.828,368.174,370.507,378.495,357.768,378.495z"
  );

  ctx.fillStyle = 'white';
  ctx.fill(p);
  ctx.restore();

  return ctx.getImageData(0, 0, size, size);
}

export function registerIcons(map: mapboxgl.Map) {
  const add = (name: string, color: string) => {
    if (!map.hasImage(name)) {
      const imageData = createTrainIcon(color, 52); 
      map.addImage(name, imageData, { pixelRatio: 2 });
    }
  };
  add('train-icon-cercanias', COLORS.cercanias);
  add('train-icon-other', COLORS.other);
}