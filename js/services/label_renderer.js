import { BASE_W } from "../constants.js";

export function measureNaturalHeight(node) {
  node.style.position = 'absolute';
  node.style.visibility = 'hidden';
  node.style.left = '-99999px';
  node.style.top = '0';
  node.style.width = BASE_W + 'px';
  document.body.appendChild(node);
  const h = node.offsetHeight;
  document.body.removeChild(node);
  return h;
}

export function getSize() {
  const wEl = document.getElementById('labelW');
  const hEl = document.getElementById('labelH');
  
}