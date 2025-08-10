import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [isLandscape, setIsLandscape] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isLandscapeMode = window.innerWidth > window.innerHeight;
            setIsLandscape(isLandscapeMode);
        };

        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            setIsMobile(isMobileDevice);
        };

        // Фикс для iOS Safari viewport
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        checkOrientation();
        checkMobile();
        setVH();

        window.addEventListener('resize', () => {
            checkOrientation();
            setVH();
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                checkOrientation();
                setVH();
            }, 100);
        });

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (isMobile && !isLandscape) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(var(--vh, 1vh) * 100)',
                backgroundColor: '#000',
                color: '#fff',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{ fontSize: '24px', marginBottom: '20px' }}>📱</div>
                <h2>Поверните устройство</h2>
                <p>Для игры в пинг-понг поверните телефон в горизонтальное положение</p>
            </div>
        );
    }

    return (
        <div id="app" style={{
            width: '100vw',
            height: 'calc(var(--vh, 1vh) * 100)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <PhaserGame ref={phaserRef} />
        </div>
    )
}

export default App
