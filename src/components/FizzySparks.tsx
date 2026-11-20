import { useEffect, useRef } from "react";

class Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  radius: number;
  colour: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 40 + Math.floor(Math.random() * 20);
    this.age = 0;
    this.radius = 3 + Math.random() * 4;
    const hue = Math.floor(Math.random() * 360);
    this.colour = `hsl(${hue}, 90%, 70%)`;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vy += 0.05;
    this.age++;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = 1 - this.age / this.life;
    ctx.fillStyle = this.colour;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.colour;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  isDead() {
    return this.age >= this.life;
  }
}

const FizzySparks = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const sparks: Spark[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameCount = 0;
    let lastSpawn = 0;
    let raf = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    };

    const spawn = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) sparks.push(new Spark(x, y));
    };

    const localPoint = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const onMove = (event: PointerEvent) => {
      const now = Date.now();
      if (now - lastSpawn <= 50) return;
      const point = localPoint(event.clientX, event.clientY);
      if (!point) return;
      spawn(point.x, point.y, 5);
      lastSpawn = now;
    };

    const onClick = (event: PointerEvent) => {
      const point = localPoint(event.clientX, event.clientY);
      if (!point) return;
      spawn(point.x, point.y, 20);
    };

    const animate = () => {
      frameCount++;
      if (!reducedMotion && frameCount % 8 === 0) {
        spawn(Math.random() * canvas.width, Math.random() * canvas.height, 2);
      }
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.update();
        spark.draw(ctx);
        if (spark.isDead()) sparks.splice(i, 1);
      }
      if (!reducedMotion) raf = requestAnimationFrame(animate);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerdown", onClick);
    spawn(canvas.width / 2, canvas.height * 0.22, 48);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onClick);
    };
  }, []);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default FizzySparks;
