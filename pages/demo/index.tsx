import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SimpleQRScanner = () => {
    const [scanResult, setScanResult] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [scanStatus, setScanStatus] = useState('等待扫描...');
    const scannerRef = useRef<Html5Qrcode>();
    const scannerContainerId = 'qr-scanner-container';
    const scanTimeoutRef = useRef<NodeJS.Timeout>();

    // 支持的扫码格式
    // const formatsToSupport = [
    //   Html5Qrcode.supportedFormats.QR_CODE,
    //   Html5Qrcode.supportedFormats.EAN_13,
    //   Html5Qrcode.supportedFormats.CODE_128,
    //   Html5Qrcode.supportedFormats.UPC_A,
    // ];

    // 初始化扫码器
    const initScanner = () => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(
                scannerContainerId,
                {
                    // formatsToSupport,
                    verbose: false,
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    }
                }
            );
        }
    };

    // 开始扫码
    const startScan = async () => {
        try {
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

            await scannerRef.current?.start(
                { facingMode: 'environment' },
                {
                    fps: 5, // 降低帧率减少性能消耗
                    qrbox: 250,
                    // rememberLastUsedCamera: true,
                    aspectRatio: 1.0 // 保持方形视图
                },
                handleScanSuccess,
                handleScanError
            );
        } catch (err) {
            handleStartError(err);
        }
    };

    // 扫码成功回调
    const handleScanSuccess = (decodedText: any, decodedResult: any) => {
        clearTimeout(scanTimeoutRef.current);
        setScanResult(decodedText);
        setScanStatus(`成功扫描到: ${decodedResult.result.format}`);
        stopScan();
        
    };

    // 扫码错误回调 - 修改为不停止扫描
    const handleScanError = (errorMsg: any) => {
        console.log('Scan error:', errorMsg);
        setScanStatus('对准二维码/条形码...');
        // 不停止扫描，继续尝试
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
            if (scannerRef.current && isScanning) {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            }
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
            <h1>简易扫码器</h1>

            {/* 扫码结果显示 */}
            <div style={styles.resultContainer}>
                <h3>扫描结果：</h3>
                <div
                >
                    {scanResult || '暂无结果'}
                </div>
            </div>

            {/* 扫码容器 */}
            <div
                id={scannerContainerId}
                style={{
                    display: isScanning ? 'block' : 'none'
                }}
            />

            {/* 操作按钮 */}
            <div style={styles.buttonContainer}>
                <button
                    style={{
                        ...styles.button,
                        ...(isScanning ? styles.buttonDisabled : styles.buttonPrimary)
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
                            ...styles.buttonDanger
                        }}
                        onClick={stopScan}
                    >
                        停止
                    </button>
                )}
            </div>

            {/* 错误提示 */}
            {error && (
                <div style={styles.errorText}>
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

// 内联样式
const styles = {
    container: {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    title: {
        textAlign: 'center',
        color: '#333'
    },
    resultContainer: {
        margin: '20px 0',
        padding: '15px',
        background: '#f5f5f5',
        borderRadius: '8px'
    },
    resultText: {
        padding: '10px',
        background: 'white',
        borderRadius: '4px',
        wordBreak: 'break-all',
        cursor: 'pointer',
        minHeight: '20px',
        border: '1px solid #ddd'
    },
    scanner: {
        width: '100%',
        height: '300px',
        margin: '20px 0',
        position: 'relative',
        border: '2px solid #07c160',
        borderRadius: '8px'
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
        cursor: 'pointer',
        transition: 'background 0.3s'
    },
    buttonPrimary: {
        background: '#07c160',
        color: 'white'
    },
    buttonDanger: {
        background: '#ff4d4f',
        color: 'white'
    },
    buttonDisabled: {
        background: '#ccc',
        cursor: 'not-allowed'
    },
    errorText: {
        color: '#ff4d4f',
        marginTop: '15px',
        padding: '10px',
        background: '#fff2f0',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    settingsButton: {
        background: 'none',
        border: '1px solid #ff4d4f',
        color: '#ff4d4f',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer'
    }
};

export default SimpleQRScanner;