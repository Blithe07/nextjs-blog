import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SimpleQRScanner = () => {
    const [scanResult, setScanResult] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef<Html5Qrcode>();
    const scannerContainerId = 'qr-scanner-container';

    // 支持的扫码格式
    //   const formatsToSupport = [
    //     Html5Qrcode.supportedFormats.QR_CODE,
    //     Html5Qrcode.supportedFormats.EAN_13,
    //     Html5Qrcode.supportedFormats.CODE_128,
    //     Html5Qrcode.supportedFormats.UPC_A,
    //   ];

    // 初始化扫码器
    const initScanner = () => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(
                scannerContainerId,
                { verbose: false }
            );
        }
    };

    // 开始扫码
    const startScan = async () => {
        try {
            initScanner();
            setIsScanning(true);
            setError('');

            await scannerRef.current?.start(
                { facingMode: 'environment' }, // 使用后置摄像头
                {
                    fps: 10,
                    qrbox: 250, // 扫描区域大小
                    // rememberLastUsedCamera: true
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
        setScanResult(decodedText);
        alert(`扫描到 ${decodedResult.result.format}: ${decodedText}`,);
        stopScan();
    };

    // 扫码错误回调
    const handleScanError = (errorMsg: any) => {
        alert('Scan error:' + errorMsg);
    };

    // 启动错误处理
    const handleStartError = (err: any) => {
        alert('Scan error:' + err);
        setError(`扫码启动失败: ${err.message}`);
        setIsScanning(false);

        if (err.name === 'NotAllowedError') {
            setError('摄像头权限被拒绝，请允许访问');
        } else if (err.name === 'NotFoundError') {
            setError('未找到摄像头设备');
        }
    };

    // 停止扫码
    const stopScan = async () => {
        try {
            if (scannerRef.current && isScanning) {
                await scannerRef.current.stop();
            }
        } catch (err) {
            console.error('Stop error:', err);
        } finally {
            setIsScanning(false);
        }
    };

    // 复制结果
    const copyResult = () => {
        if (scanResult) {
            navigator.clipboard.writeText(scanResult);
            alert('已复制到剪贴板');
        }
    };

    // 组件卸载时停止扫码
    useEffect(() => {
        return () => {
            stopScan();
        };
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>简易扫码器</h1>

            {/* 扫码结果显示 */}
            <div style={styles.resultContainer}>
                <h3>扫描结果：</h3>
                <div
                    style={styles.resultText}
                    onClick={copyResult}
                    title="点击复制"
                >
                    {scanResult || '暂无结果'}
                </div>
            </div>

            {/* 扫码容器 */}
            <div
                id={scannerContainerId}
                style={{
                    ...styles.scanner,
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