document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration
    // Configuration
    const particleCount = 156; // Increased by another 20% (130 * 1.2)
    const connectionDistance = 144; // Scaled up by 20% (120 * 1.2)
    const mouseSafetyRadius = 200;

    let mouse = { x: null, y: null };

    // Resize
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        // Retina display support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Re-init particles on drastic resize (optional, but keeps distribution nice)
        initParticles();
    }

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random(); // Depth factor 0..1 (1 = close, 0 = far)

            // Velocity
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;

            // Size based on Z (Scaled up by ~1.2x as requested)
            this.size = (1.5 + this.z * 2) * 1.2;
        }

        update() {
            // Basic movement
            this.x += this.vx;
            this.y += this.vy;

            // Boundary wrap
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Parallax effect based on mouse
            if (mouse.x != null) {
                const dx = (mouse.x - width / 2) * 0.0005 * this.z; // Closer particles move more? Or less? Usually closer move more in parallax.
                const dy = (mouse.y - height / 2) * 0.0005 * this.z;
                this.x += dx;
                this.y += dy;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            // Alpha based on Z
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + this.z * 0.4})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw particles
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw connections
        connectParticles();

        requestAnimationFrame(animate);
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const p1 = particles[a];
                const p2 = particles[b];

                // Calculate distance
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    // Opacity based on distance AND Z-depths (giving a foggy 3D feel)
                    const opacity = 1 - (distance / connectionDistance);
                    const zFactor = (p1.z + p2.z) / 2; // Average depth strength

                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.7 * zFactor})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    // Event Listeners
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    // Init
    resize();
    initParticles();
    animate();
});
