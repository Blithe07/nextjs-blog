import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    scanTimeout?: number;
    onScanSuccess?: (decodedText: string) => void;
    onScanError?: (error: string | Error) => void;
}

export interface QRScannerRef {
    showScanner: () => void;
    hideScanner: () => void;
    startScan: () => void;
    stopScan: () => void;
}

const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(({
    scanTimeout = 30000,
    onScanSuccess,
    onScanError
}, ref) => {
    const [visible, setVisible] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanTimeoutRef = useRef<NodeJS.Timeout>();
    const lastScanTimeRef = useRef(0);
    const scannerContainerId = 'qr-scanner-container';
    const [scanResult, setScanResult] = useState('');

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        showScanner,
        hideScanner,
        startScan,
        stopScan
    }));

    // 显示扫码遮罩
    const showScanner = () => {
        setVisible(true);
    };

    // 隐藏扫码遮罩
    const hideScanner = () => {
        setVisible(false);
        stopScan();
    };

    // 初始化扫码器
    const initScanner = () => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(
                scannerContainerId,
                {
                    verbose: false,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                }
            );
        }
    };

    // 清理扫码器
    const cleanupScanner = async () => {
        try {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            }
        } catch (err) {
            console.error('Cleanup error:', err);
            onScanError?.(err as Error);
        }
    };

    // 开始扫码
    const startScan = async () => {
        // 防止快速连续点击
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) return;
        lastScanTimeRef.current = now;

        try {
            await cleanupScanner();
            initScanner();

            setIsScanning(true);

            // 清除之前的超时
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            // 设置超时自动停止
            scanTimeoutRef.current = setTimeout(() => {
                if (isScanning) {
                    onScanError?.('扫描超时');
                    stopScan();
                }
            }, scanTimeout);

            // 添加延迟以改善视觉过渡
            await new Promise(resolve => setTimeout(resolve, 300));

            await scannerRef.current?.start(
                { facingMode: 'environment' },
                {
                    fps: 12, // 降低帧率
                    videoConstraints: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    // qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.777,
                    disableFlip: true, // 禁用图像翻转提高性能
                },
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            handleStartError(err as Error);
        }
    };

    // 扫码成功回调
    const handleScanSuccess = (decodedText: string, decodedResult: any) => {
        // 添加成功扫描后的延迟，防止快速连续触发
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) return;
        lastScanTimeRef.current = now;

        clearTimeout(scanTimeoutRef.current);
        onScanSuccess?.(decodedText);
        setScanResult(decodedText)
        stopScan();
    };

    // 扫码错误回调
    const handleScanError = (errorMsg: string) => {
        console.log('Scan error:', errorMsg);
        onScanError?.(errorMsg);
    };

    // 启动错误处理
    const handleStartError = (err: Error) => {
        console.error('Start error:', err);
        setIsScanning(false);

        let errorMessage = '扫码启动失败';
        if (err.name === 'NotAllowedError') {
            errorMessage = '摄像头权限被拒绝，请允许访问';
        } else if (err.name === 'NotFoundError') {
            errorMessage = '未找到摄像头设备';
        } else if (err.name === 'NotReadableError') {
            errorMessage = '摄像头被占用，请关闭其他使用摄像头的应用';
        }

        onScanError?.(errorMessage);
    };

    // 停止扫码
    const stopScan = async () => {
        try {
            await cleanupScanner();
        } catch (err) {
            console.error('Stop error:', err);
            onScanError?.(err as Error);
        } finally {
            setIsScanning(false);
            clearTimeout(scanTimeoutRef.current);
            setVisible(false)
        }
    };

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            stopScan();
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div>
            <div>
                <button onClick={() => {
                    showScanner()
                    startScan()
                }}>开启扫描</button>
                <div>{scanResult || 'no result'}</div>
            </div>
            {visible && <div style={{ ...styles.scannerOverlay, position: 'fixed' }}>
                <div style={{ ...styles.scannerMask, position: 'relative' }}>
                    {/* <div style={{ ...styles.scannerFrame, position: 'absolute' }}>
                        <div className='line'></div>
                    </div> */}
                    <div id={scannerContainerId} style={{ ...styles.scannerViewport, position: 'relative' }}></div>
                </div>
            </div>}
        </div>
    );
});

// 样式
const styles = {
    scannerOverlay: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#333',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerMask: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    scannerFrame: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '250px',
        height: '250px',
        border: '1px solid #000',
        boxShadow: '0 0 0 10000px rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    scannerViewport: {
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 0,
        opacity: 0.9,
    },
};

export default QRScanner;