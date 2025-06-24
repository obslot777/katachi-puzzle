const svgNS = "http://www.w3.org/2000/svg";

const allCorrectSound = new Audio("allcorrect.mp3");

const shapes = [
  {name: 'circle', draw: (svg, strokeDash) => {
    let c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", "45");
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", "#aaa");
    c.setAttribute("stroke-width", "3");
    c.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(c);
  }},
  {name: 'square', draw: (svg, strokeDash) => {
    let r = document.createElementNS(svgNS, "rect");
    r.setAttribute("x", "5"); r.setAttribute("y", "5"); r.setAttribute("width", "90"); r.setAttribute("height", "90");
    r.setAttribute("fill", "none");
    r.setAttribute("stroke", "#aaa");
    r.setAttribute("stroke-width", "3");
    r.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(r);
  }},
  {name: 'triangle', draw: (svg, strokeDash) => {
    let p = document.createElementNS(svgNS, "polygon");
    p.setAttribute("points", "50,5 95,95 5,95");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#aaa");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(p);
  }},
  {name: 'star', draw: (svg, strokeDash) => {
    let p = document.createElementNS(svgNS, "polygon");
    p.setAttribute("points", "50,5 61,35 95,35 68,57 75,90 50,72 25,90 32,57 5,35 39,35");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#aaa");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(p);
  }},
  {name: 'heart', draw: (svg, strokeDash) => {
    let path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M50 90 C20 60, 10 30, 50 40 C90 30, 80 60, 50 90 Z");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#aaa");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(path);
  }},
  {name: 'diamond', draw: (svg, strokeDash) => {
    let p = document.createElementNS(svgNS, "polygon");
    p.setAttribute("points", "50,5 95,50 50,95 5,50");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#aaa");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", strokeDash);
    svg.appendChild(p);
  }}
];

function shuffle(array) {
  for (let i = array.length -1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

let draggedElem = null;
let draggingClone = null;
let offsetX = 0;
let offsetY = 0;

function createPuzzle() {
  // 古いドラッグ要素の削除
  if (draggingClone) {
    draggingClone.remove();
    draggingClone = null;
  }
  draggedElem = null;
  const dropArea = document.getElementById('drop-area');
  const shapeArea = document.getElementById('shape-area');
  dropArea.innerHTML = '';
  shapeArea.innerHTML = '';
  shuffle(shapes);

  // ドロップゾーン生成
  shapes.forEach(s => {
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.shape = s.name;
    zone.addEventListener('dragover', e => e.preventDefault());
    zone.addEventListener('drop', dropHandler);
    dropArea.appendChild(zone);

    const svg = document.createElementNS(svgNS, "svg");
    s.draw(svg, "5,5");
    zone.appendChild(svg);
  });

  // ドラッグ可能な図形生成
  const shapeCopy = [...shapes];
  shuffle(shapeCopy);
  shapeCopy.forEach(s => {
    const box = document.createElement('div');
    box.className = 'shape-box';
    box.setAttribute("draggable", "true");
    box.dataset.shape = s.name;
    box.id = s.name;

    // PCドラッグイベント
    box.addEventListener('dragstart', e => {
      draggedElem = e.target;
      e.dataTransfer.setData('text/plain', e.target.dataset.shape);
    });

    // タッチイベント対応
    box.addEventListener('touchstart', touchStartHandler, {passive:false});
    box.addEventListener('touchmove', touchMoveHandler, {passive:false});
    box.addEventListener('touchend', touchEndHandler);

    const svg = document.createElementNS(svgNS, "svg");
    s.draw(svg, "0");
    svg.querySelector('*').setAttribute("fill", randomColor());
    box.appendChild(svg);

    shapeArea.appendChild(box);
  });
}

function dropHandler(e) {
  e.preventDefault();
  const shapeName = e.dataTransfer.getData('text/plain');
  if (shapeName === this.dataset.shape) {
    this.innerHTML = '';

    const svg = document.createElementNS(svgNS, "svg");
    const shape = shapes.find(s => s.name === shapeName);
    shape.draw(svg, "0");
    svg.querySelector('*').setAttribute("fill", randomColor());
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    this.appendChild(svg);

    // ドロップ済みフラグをセット
    this.dataset.dropped = "true";

    document.getElementById('correct-sound').play();

    const shapeElem = document.getElementById(shapeName);
    if(shapeElem) shapeElem.remove();

    checkClear();
  }
}

function checkClear() {
  const zones = document.querySelectorAll('.drop-zone');
  // すべてのドロップゾーンがドロップ済みか判定
  const complete = Array.from(zones).every(zone => zone.dataset.dropped === "true");

  if (complete) {

    // 2秒後にクリア音再生＆紙吹雪スタート
    allCorrectTimer = setTimeout(() => {
      allCorrectSound.currentTime = 0;
      allCorrectSound.play();

      // 紙吹雪開始
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4db6ac', '#81d4fa', '#a5d6a7', '#4fc3f7', '#00acc1']
      });
    }, 2000);

    zones.forEach(z => {
        // フラグリセット
        delete z.dataset.dropped;
      });

    // 7秒後（2秒+5秒）にゲーム再開
    restartTimer = setTimeout(() => {
            createPuzzle();
          }, 7000);
  }
}

function randomColor() {
  const colors = ['#ff9999','#99ccff','#99ff99','#ffcc66','#ff66cc','#66ffff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// --- タッチドラッグ処理 ---

function touchStartHandler(e) {
  e.preventDefault();
  if (e.touches.length !== 1) return;
  draggedElem = e.currentTarget;

  // ドラッグ用クローン作成
  draggingClone = draggedElem.cloneNode(true);
  draggingClone.classList.add('dragging');
  document.body.appendChild(draggingClone);

  const touch = e.touches[0];
  const rect = draggedElem.getBoundingClientRect();
  offsetX = touch.clientX - rect.left;
  offsetY = touch.clientY - rect.top;

  moveDraggingClone(touch.clientX, touch.clientY);
}

function touchMoveHandler(e) {
  e.preventDefault();
  if (!draggingClone) return;
  const touch = e.touches[0];
  moveDraggingClone(touch.clientX, touch.clientY);
}

function touchEndHandler(e) {
  e.preventDefault();
  if (!draggingClone) return;

  // ドロップ判定
  const dropZones = document.querySelectorAll('.drop-zone');
  const cloneRect = draggingClone.getBoundingClientRect();
  let dropped = false;
  dropZones.forEach(zone => {
    const zoneRect = zone.getBoundingClientRect();
    if (isIntersecting(cloneRect, zoneRect) && draggedElem.dataset.shape === zone.dataset.shape) {
      // 正解ドロップ
      zone.innerHTML = '';
      const svg = document.createElementNS(svgNS, "svg");
      const shape = shapes.find(s => s.name === draggedElem.dataset.shape);
      shape.draw(svg, "0");
      svg.querySelector('*').setAttribute("fill", randomColor());
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
      zone.appendChild(svg);

      document.getElementById('correct-sound').play();

      // 元のドラッグ要素削除
      if(draggedElem.parentNode) draggedElem.parentNode.removeChild(draggedElem);

      // ドロップ済みフラグをセット
      zone.dataset.dropped = "true";

      checkClear();
      dropped = true;
    }
  });

  if (!dropped) {
    // 元に戻る（何もしない）
  }

  draggingClone.remove();
  draggingClone = null;
  draggedElem = null;
}

function moveDraggingClone(x, y) {
  draggingClone.style.left = (x - offsetX) + 'px';
  draggingClone.style.top = (y - offsetY) + 'px';
}

function isIntersecting(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

createPuzzle();
