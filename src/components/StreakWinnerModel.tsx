import React, { useEffect, useRef } from 'react';

type StreakWinnerModelProps = {
    onClose: () => void;
    visible: boolean;
};

const StreakWinnerModel: React.FC<StreakWinnerModelProps> = ({ onClose, visible }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!visible || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const colors = ['#ff4fd8', '#d24bff', '#63d0ff', '#a77bff', '#ffffff'];

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            size: number;
            rotation: number;
            rotationSpeed: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height - canvas.height;
                this.vx = Math.random() * 2 - 1;
                this.vy = Math.random() * 3 + 2;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = Math.random() * 8 + 4;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 4 - 2;
            }

            update() {
                this.y += this.vy;
                this.x += this.vx;
                this.rotation += this.rotationSpeed;

                if (this.y > canvas.height) {
                    this.y = -20;
                    this.x = Math.random() * canvas.width;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Create particles
        for (let i = 0; i < 150; i++) {
            particles.push(new Particle());
        }

        let animationId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update();
                p.draw();
            });
            animationId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <div style={styles.overlay}>
            <canvas ref={canvasRef} style={styles.canvas} />
            <div style={styles.modal}>
                <div style={styles.content}>
                    <div style={styles.icon}>👑</div>
                    <h2 style={styles.title}>Master Streak! 🔥</h2>
                    <p style={styles.message}>
                        You’ve achieved a 5-win consecutive streak.
                    </p>
                    <button onClick={onClose} style={styles.button}>
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 4, 24, 0.85)', // Deep purple/black overlay
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    modal: {
        background: 'var(--theme-card-bg, linear-gradient(135deg, rgba(22, 9, 44, 0.95), rgba(10, 6, 26, 0.95)))',
        padding: '40px',
        borderRadius: '24px',
        maxWidth: '90%',
        width: '400px',
        textAlign: 'center',
        boxShadow: '0 0 50px rgba(210, 75, 255, 0.3), border: 1px solid rgba(163, 112, 255, 0.35)',
        border: '1px solid var(--theme-card-border, rgba(163, 112, 255, 0.35))',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 1001,
        backdropFilter: 'blur(10px)',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
    },
    icon: {
        fontSize: '64px',
        marginBottom: '10px',
        filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.6))',
    },
    title: {
        color: '#fff',
        margin: 0,
        fontSize: '28px',
        fontWeight: '800',
        background: 'var(--theme-title-gradient, linear-gradient(90deg, #ff4fd8, #d24bff 35%, #63d0ff 70%))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 20px rgba(210, 75, 255, 0.5)',
    },
    message: {
        color: 'var(--theme-text-soft, #d4c7f3)',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: '0',
        fontWeight: '500',
    },
    button: {
        marginTop: '20px',
        padding: '14px 32px',
        background: 'var(--theme-accent-gradient, linear-gradient(135deg, #5c3bff, #d24bff))',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 15px rgba(210, 75, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
};

export default StreakWinnerModel;
