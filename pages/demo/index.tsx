import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const OptimizedQRScanner = () => {
    const [scanResult, setScanResult] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [scanStatus, setScanStatus] = useState('等待扫描...');
    const scannerRef = useRef<Html5Qrcode>();
    const scannerContainerId = 'qr-scanner-container';
    const scanTimeoutRef = useRef<NodeJS.Timeout>();
    const lastScanTimeRef = useRef<number>(0);

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
                if (scannerRef.current?.isScanning) {
                    await scannerRef.current?.stop();
                }
                scannerRef.current?.clear();
            }
        } catch (err) {
            console.error('Cleanup error:', err);
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
            setError('');
            setScanStatus('正在扫描...');
            setScanResult('');

            // 清除之前的超时
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            // 设置超时（30秒无结果自动停止）
            scanTimeoutRef.current = setTimeout(() => {
                if (isScanning) {
                    setScanStatus('未检测到二维码/条形码');
                    stopScan();
                }
            }, 30000);

            // 添加延迟以改善视觉过渡
            await new Promise(resolve => setTimeout(resolve, 300));

            await scannerRef.current?.start(
                { facingMode: 'environment' },
                {
                    fps: 3, // 进一步降低帧率
                    qrbox: 250,
                    disableFlip: true // 禁用图像翻转提高性能
                },
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            handleStartError(err);
        }
    };

    // 扫码成功回调
    const handleScanSuccess = (decodedText: string, decodedResult: any) => {
        // 添加成功扫描后的延迟，防止快速连续触发
        const now = Date.now();
        if (now - lastScanTimeRef.current < 1000) return;
        lastScanTimeRef.current = now;

        clearTimeout(scanTimeoutRef.current);
        setScanResult(decodedText);
        setScanStatus(`成功扫描到: ${decodedResult.result.format}`);

        // 添加成功反馈动画
        setScanStatus(prev => {
            setTimeout(() => {
                setScanStatus('扫描成功!');
                setTimeout(() => stopScan(), 800);
            }, 300);
            return '正在处理...';
        });
    };

    // 扫码错误回调
    const handleScanError = (errorMsg: string) => {
        console.log('Scan error:', errorMsg);
        setScanStatus('对准二维码/条形码...');
    };

    // 启动错误处理
    const handleStartError = (err: any) => {
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

        setError(errorMessage);
        setScanStatus(errorMessage);
    };

    // 停止扫码
    const stopScan = async () => {
        try {
            await cleanupScanner();
        } catch (err) {
            console.error('Stop error:', err);
        } finally {
            setIsScanning(false);
            clearTimeout(scanTimeoutRef.current);
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
        <div style={styles.container}>
            <h1 style={styles.title}>优化扫码器</h1>

            {/* 状态显示 */}
            <div style={styles.statusContainer}>
                <div style={styles.statusText}>{scanStatus}</div>
            </div>

            {/* 扫码结果显示 */}
            {scanResult && (
                <div style={styles.resultContainer}>
                    <h3>扫描结果：</h3>
                    <div style={styles.resultText}>
                        {scanResult}
                    </div>
                </div>
            )}

            {/* 扫码容器 - 添加过渡效果 */}
            <div
                id={scannerContainerId}
                style={{
                    ...styles.scanner,
                    position: 'relative',
                    display: isScanning ? 'block' : 'none',
                    opacity: isScanning ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                }}
            />

            {/* 操作按钮 */}
            <div style={styles.buttonContainer}>
                <button
                    style={{
                        ...styles.button,
                        ...(isScanning ? styles.buttonDisabled : styles.buttonPrimary),
                        transition: 'all 0.3s ease'
                    }}
                    onClick={startScan}
                    disabled={isScanning}
                >
                    {isScanning ? '扫描中...' : '开始扫码'}
                </button>

                {isScanning && (
                    <button
                        style={{
                            ...styles.button,
                            ...styles.buttonDanger,
                            transition: 'all 0.3s ease'
                        }}
                        onClick={stopScan}
                    >
                        停止
                    </button>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div style={{
                    ...styles.errorText,
                    animation: 'fadeIn 0.5s ease'
                }}>
                    {error}
                    {error.includes('权限') && (
                        <button
                            style={styles.settingsButton}
                            onClick={() => window.location.href = 'app-settings:'}
                        >
                            去设置
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// 样式定义
const styles = {
    container: {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    title: {
        'text-align': 'center',
        color: '#333',
        marginBottom: '20px'
    },
    statusContainer: {
        margin: '10px 0',
        padding: '10px',
        background: '#f0f8ff',
        borderRadius: '5px',
        'text-align': 'center',
        transition: 'all 0.3s ease'
    },
    statusText: {
        color: '#1e90ff',
        fontWeight: 'bold',
        transition: 'all 0.3s ease'
    },
    resultContainer: {
        margin: '20px 0',
        padding: '15px',
        background: '#f5f5f5',
        borderRadius: '8px',
        transition: 'all 0.3s ease'
    },
    resultText: {
        padding: '10px',
        background: 'white',
        borderRadius: '4px',
        'word-break': 'break-word',
        border: '1px solid #ddd',
        transition: 'all 0.3s ease'
    },
    scanner: {
        width: '100%',
        height: '300px',
        margin: '20px 0',
        position: 'relative',
        border: '2px solid #1e90ff',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    buttonContainer: {
        display: 'flex',
        gap: '10px',
        marginTop: '20px'
    },
    button: {
        flex: 1,
        padding: '12px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer'
    },
    buttonPrimary: {
        background: '#1e90ff',
        color: 'white',
        ':hover': {
            background: '#187bcd'
        }
    },
    buttonDanger: {
        background: '#ff6b6b',
        color: 'white',
        ':hover': {
            background: '#fa5252'
        }
    },
    buttonDisabled: {
        background: '#ccc',
        cursor: 'not-allowed'
    },
    errorText: {
        color: '#ff4757',
        marginTop: '15px',
        padding: '10px',
        background: '#ffecec',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    settingsButton: {
        background: 'none',
        border: '1px solid #ff4757',
        color: '#ff4757',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer'
    }
};

export default OptimizedQRScanner;