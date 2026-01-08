import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function Terms() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            <header className="bg-white sticky top-0 z-10 p-4 border-b border-gray-100 flex items-center gap-4 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-lg font-bold">Termos e Condições</h1>
            </header>

            <div className="p-6 prose prose-sm max-w-none text-text-main">
                <p className="text-xs text-text-muted mb-4">Última atualização: 27.12.2025</p>

                <p>
                    Estes Termos e Condições (“<strong>Condições</strong>”) regulam o acesso e o uso da plataforma tecnológica <strong>eLift</strong>, composta por aplicações móveis e serviços digitais (doravante designados “<strong>Aplicativo</strong>” ou “<strong>Plataforma</strong>”), operada pela <strong>eLift</strong> (“<strong>eLift</strong>”, “<strong>nós</strong>”, “<strong>nosso</strong>”).
                </p>

                <p>
                    Ao criar uma conta, aceder ou utilizar o Aplicativo, o utilizador (“<strong>Utilizador</strong>”, “<strong>Você</strong>”) declara que <strong>leu, compreendeu e aceitou integralmente</strong> estas Condições.
                </p>

                <hr className="my-6 border-gray-200" />

                <h2 className="text-lg font-bold mb-2">1. NATUREZA DO SERVIÇO</h2>
                <p>1.1. A <strong>eLift é uma plataforma tecnológica de intermediação</strong>, que permite:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>a passageiros solicitarem serviços de transporte;</li>
                    <li>a motoristas independentes aceitarem e realizarem essas solicitações;</li>
                    <li>a frotistas gerirem motoristas e veículos registados.</li>
                </ul>
                <p>1.2. <strong>A eLift não presta serviços de transporte</strong>, não é empresa de táxis, nem empregadora dos motoristas.</p>
                <p>1.3. Os serviços de transporte são prestados <strong>exclusivamente por motoristas terceiros</strong>, de forma independente.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">2. ELEGIBILIDADE</h2>
                <p>Para utilizar o Aplicativo, o Utilizador deve:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Ter <strong>idade legal mínima</strong> para celebrar contratos;</li>
                    <li>Fornecer informações verdadeiras, completas e atualizadas;</li>
                    <li>Cumprir todas as leis e regulamentos aplicáveis.</li>
                </ul>
                <p>Motoristas e frotistas devem cumprir requisitos adicionais definidos pela eLift.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">3. REGISTO E CONTA</h2>
                <p>3.1. O acesso ao Aplicativo requer criação de conta, normalmente através de:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Número de telemóvel (com verificação por código);</li>
                    <li>Ou outros métodos disponibilizados pela eLift.</li>
                </ul>
                <p>3.2. O Utilizador é <strong>responsável por manter a confidencialidade</strong> da sua conta.</p>
                <p>3.3. A eLift reserva-se o direito de <strong>suspender ou encerrar contas</strong> em caso de uso indevido, fraude ou violação destas Condições.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">4. USO DO APLICATIVO</h2>
                <p>O Utilizador compromete-se a:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Utilizar o Aplicativo apenas para fins legítimos;</li>
                    <li>Não praticar atividades fraudulentas, abusivas ou ilegais;</li>
                    <li>Não interferir no funcionamento da Plataforma.</li>
                </ul>
                <p>É proibido:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Fornecer informações falsas;</li>
                    <li>Utilizar a Plataforma para fins ilícitos;</li>
                    <li>Tentar aceder a sistemas ou dados não autorizados.</li>
                </ul>

                <h2 className="text-lg font-bold mb-2 mt-6">5. PAGAMENTOS E TARIFAS</h2>
                <p>5.1. As tarifas são apresentadas antes da confirmação da viagem, podendo variar conforme:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Distância;</li>
                    <li>Tempo;</li>
                    <li>Categoria do serviço;</li>
                    <li>Condições operacionais.</li>
                </ul>
                <p>5.2. A eLift pode cobrar <strong>taxas de serviço</strong> pela utilização da Plataforma.</p>
                <p>5.3. Pagamentos podem ser efetuados por meios digitais ou outros métodos disponíveis.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">6. MOTORISTAS E FROTISTAS</h2>
                <p>6.1. Motoristas atuam como <strong>prestadores independentes</strong>.</p>
                <p>6.2. A eLift pode solicitar documentos, verificações e validações.</p>
                <p>6.3. O painel de ganhos, métricas e controlo de jornada tem carácter <strong>informativo</strong>, não substituindo registos fiscais oficiais.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">7. AVALIAÇÕES E FEEDBACK</h2>
                <p>7.1. Passageiros e motoristas podem avaliar-se mutuamente.</p>
                <p>7.2. A eLift pode usar avaliações para:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Melhorar a qualidade do serviço;</li>
                    <li>Suspender ou limitar contas problemáticas.</li>
                </ul>

                <h2 className="text-lg font-bold mb-2 mt-6">8. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                <p>8.1. A eLift <strong>não se responsabiliza</strong> por:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Ações ou omissões de motoristas ou passageiros;</li>
                    <li>Avarias, acidentes ou perdas ocorridas durante o transporte;</li>
                    <li>Interrupções técnicas fora do seu controlo.</li>
                </ul>
                <p>8.2. A Plataforma é fornecida “<strong>como está</strong>” e “<strong>conforme disponível</strong>”.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">9. PRIVACIDADE E DADOS</h2>
                <p>9.1. O tratamento de dados pessoais é regulado pela **Política de Privacidade da eLift**.</p>
                <p>9.2. Ao utilizar o Aplicativo, o Utilizador concorda com a recolha e uso dos seus dados conforme essa política.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">10. MODIFICAÇÕES DOS TERMOS</h2>
                <p>A eLift pode atualizar estas Condições a qualquer momento. A continuação do uso do Aplicativo após alterações implica aceitação dos novos termos.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">11. RESCISÃO</h2>
                <p>O Utilizador pode encerrar a conta a qualquer momento. A eLift pode suspender ou encerrar o acesso em caso de violação destas Condições.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">12. LEI APLICÁVEL E JURISDIÇÃO</h2>
                <p>Estas Condições são regidas pelas <strong>leis da República de Moçambique</strong>, salvo disposição legal em contrário.</p>

                <h2 className="text-lg font-bold mb-2 mt-6">13. CONTACTO</h2>
                <p>Para questões, suporte ou reclamações:</p>
                <p className="font-medium text-primary">suporte@elift.co.mz</p>

                <div className="h-10"></div>
            </div>
        </div>
    );
}
