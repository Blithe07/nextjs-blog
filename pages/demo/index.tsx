import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Toast, Spin, Modal } from 'antd-mobile';
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
    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scanTimeoutRef = useRef<NodeJS.Timeout>();
    const lastScanTimeRef = useRef(0);
    const scannerContainerId = 'qr-scanner-container';

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
            setIsLoading(true);
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
                    Toast.show({
                        content: '扫描超时，请重试',
                        position: 'center',
                    });
                    onScanError?.('扫描超时');
                    stopScan();
                }
            }, scanTimeout);

            // 添加延迟以改善视觉过渡
            await new Promise(resolve => setTimeout(resolve, 300));

            await scannerRef.current?.start(
                { facingMode: 'environment' },
                {
                    fps: 3, // 降低帧率
                    disableFlip: true // 禁用图像翻转提高性能
                },
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            handleStartError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    // 扫码成功回调
    const handleScanSuccess = (decodedText: string) => {
        // 添加成功扫描后的延迟，防止快速连续触发
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) return;
        lastScanTimeRef.current = now;

        clearTimeout(scanTimeoutRef.current);
        onScanSuccess?.(decodedText);
        setScanResult(decodedText);
        Toast.show({
            content: '扫码成功',
            position: 'center',
        });
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

        Toast.show({
            content: errorMessage,
            position: 'center',
        });
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
            setVisible(false);
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
            <Button
                color='primary'
                size='large'
                onClick={() => {
                    showScanner();
                    startScan();
                }}
                style={{ margin: '16px auto' }}
            >
                开始扫码
            </Button>

            {scanResult && (
                <div style={{
                    margin: '16px',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                }}>
                    <div style={{ color: '#999', fontSize: '14px' }}>扫描结果</div>
                    <div style={{ marginTop: '8px', wordBreak: 'break-all' }}>{scanResult}</div>
                </div>
            )}

            <Modal
                visible={visible}
                content={
                    <div style={styles.scannerOverlay}>
                        {isLoading && (
                            <div style={styles.loadingContainer}>
                                <Spin
                                    style={{ '--size': '24px', '--color': '#1677ff' }}
                                >
                                    初始化摄像头...
                                </Spin>
                            </div>
                        )}

                        <div style={styles.scannerMask}>
                            <div style={styles.scannerFrame}>
                                <div style={styles.cornerTL} />
                                <div style={styles.cornerTR} />
                                <div style={styles.cornerBL} />
                                <div style={styles.cornerBR} />
                            </div>
                            <div id={scannerContainerId} style={styles.scannerViewport} />
                        </div>
                    </div>
                }
                closeOnAction
                onClose={hideScanner}
                actions={[
                    {
                        key: 'close',
                        text: '关闭扫描',
                        danger: true,
                    }
                ]}
                bodyStyle={{
                    padding: 0
                }}
            />
        </div>
    );
});

// 样式
const styles = {
    scannerOverlay: {
        position: 'relative',
        width: '100%',
        height: '70vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    } as React.CSSProperties,
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        color: '#fff'
    } as React.CSSProperties,
    scannerMask: {
        position: 'relative',
        width: '100%',
        height: '100%'
    } as React.CSSProperties,
    scannerFrame: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '250px',
        height: '250px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 0 0 100vmax rgba(0, 0, 0, 0.7)',
        zIndex: 1,
        pointerEvents: 'none'
    } as React.CSSProperties,
    cornerTL: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderLeft: '3px solid #1677ff',
        borderTop: '3px solid #1677ff'
    } as React.CSSProperties,
    cornerTR: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '40px',
        height: '40px',
        borderRight: '3px solid #1677ff',
        borderTop: '3px solid #1677ff'
    } as React.CSSProperties,
    cornerBL: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '40px',
        height: '40px',
        borderLeft: '3px solid #1677ff',
        borderBottom: '3px solid #1677ff'
    } as React.CSSProperties,
    cornerBR: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '40px',
        height: '40px',
        borderRight: '3px solid #1677ff',
        borderBottom: '3px solid #1677ff'
    } as React.CSSProperties,
    scannerViewport: {
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 0,
        opacity: 0.9
    } as React.CSSProperties
};

export default QRScanner;