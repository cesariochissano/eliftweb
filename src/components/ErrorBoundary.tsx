import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-gray-500 max-w-md mb-8">
                        Encontramos um erro inesperado. Tente recarregar a página para voltar a usar o eLift.
                    </p>
                    <Button
                        className="h-12 px-8 font-bold gap-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw size={20} /> Recarregar Aplicação
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
