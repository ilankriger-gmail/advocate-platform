'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

/**
 * Propriedades do componente Tabs
 *
 * @interface TabsProps
 *
 * @example
 * // Tabs básico com conteúdo simples
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Visão Geral</TabsTrigger>
 *     <TabsTrigger value="details">Detalhes</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">
 *     <p>Conteúdo da visão geral</p>
 *   </TabsContent>
 *   <TabsContent value="details">
 *     <p>Conteúdo dos detalhes</p>
 *   </TabsContent>
 * </Tabs>
 *
 * @example
 * // Tabs com onChange para rastrear mudanças
 * <Tabs
 *   defaultValue="profile"
 *   onChange={(value) => console.log('Tab ativa:', value)}
 * >
 *   <TabsList>
 *     <TabsTrigger value="profile">Perfil</TabsTrigger>
 *     <TabsTrigger value="settings">Configurações</TabsTrigger>
 *     <TabsTrigger value="notifications">Notificações</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="profile">
 *     <UserProfile />
 *   </TabsContent>
 *   <TabsContent value="settings">
 *     <UserSettings />
 *   </TabsContent>
 *   <TabsContent value="notifications">
 *     <NotificationSettings />
 *   </TabsContent>
 * </Tabs>
 *
 * @example
 * // Tabs com formulário em cada painel
 * <Tabs defaultValue="personal">
 *   <TabsList>
 *     <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
 *     <TabsTrigger value="company">Empresa</TabsTrigger>
 *     <TabsTrigger value="payment">Pagamento</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="personal">
 *     <Input label="Nome" />
 *     <Input label="Email" />
 *   </TabsContent>
 *   <TabsContent value="company">
 *     <Input label="Nome da Empresa" />
 *     <Input label="CNPJ" />
 *   </TabsContent>
 *   <TabsContent value="payment">
 *     <Select label="Forma de Pagamento" options={[...]} />
 *   </TabsContent>
 * </Tabs>
 *
 * @example
 * // Tabs com estilização customizada
 * <Tabs defaultValue="active" className="bg-white rounded-lg shadow-sm p-4">
 *   <TabsList className="mb-6">
 *     <TabsTrigger value="active">Ativos</TabsTrigger>
 *     <TabsTrigger value="pending">Pendentes</TabsTrigger>
 *     <TabsTrigger value="completed">Concluídos</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="active" className="space-y-4">
 *     <TaskList status="active" />
 *   </TabsContent>
 *   <TabsContent value="pending" className="space-y-4">
 *     <TaskList status="pending" />
 *   </TabsContent>
 *   <TabsContent value="completed" className="space-y-4">
 *     <TaskList status="completed" />
 *   </TabsContent>
 * </Tabs>
 *
 * @example
 * // Tabs com conteúdo dinâmico carregado sob demanda
 * <Tabs
 *   defaultValue="posts"
 *   onChange={(value) => loadTabContent(value)}
 * >
 *   <TabsList>
 *     <TabsTrigger value="posts">Posts</TabsTrigger>
 *     <TabsTrigger value="comments">Comentários</TabsTrigger>
 *     <TabsTrigger value="analytics">Analytics</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="posts">
 *     {isLoadingPosts ? <Skeleton /> : <PostsList posts={posts} />}
 *   </TabsContent>
 *   <TabsContent value="comments">
 *     {isLoadingComments ? <Skeleton /> : <CommentsList comments={comments} />}
 *   </TabsContent>
 *   <TabsContent value="analytics">
 *     {isLoadingAnalytics ? <Skeleton /> : <AnalyticsChart data={analytics} />}
 *   </TabsContent>
 * </Tabs>
 */
export interface TabsProps {
  /**
   * Valor da tab que deve ser exibida inicialmente.
   * Deve corresponder ao value de um dos TabsTrigger.
   */
  defaultValue: string;

  /**
   * Conteúdo do componente, incluindo TabsList, TabsTrigger e TabsContent.
   * Deve seguir a estrutura de composição do sistema de tabs.
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para customizar o container principal.
   */
  className?: string;

  /**
   * Função callback executada sempre que a tab ativa é alterada.
   * Recebe o valor da nova tab ativa como parâmetro.
   */
  onChange?: (value: string) => void;
}

/**
 * Componente Tabs principal
 *
 * Container principal do sistema de tabs que gerencia o estado da tab ativa.
 * Fornece contexto para os componentes TabsList, TabsTrigger e TabsContent.
 * Suporta navegação por teclado e acessibilidade com roles ARIA apropriados.
 *
 * @param {TabsProps} props - Propriedades do componente
 * @returns {JSX.Element} Container de tabs com gerenciamento de estado
 */
export function Tabs({ defaultValue, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * Propriedades do componente TabsList
 *
 * @interface TabsListProps
 *
 * @example
 * // TabsList básico com três tabs
 * <TabsList>
 *   <TabsTrigger value="home">Início</TabsTrigger>
 *   <TabsTrigger value="about">Sobre</TabsTrigger>
 *   <TabsTrigger value="contact">Contato</TabsTrigger>
 * </TabsList>
 *
 * @example
 * // TabsList com estilização customizada
 * <TabsList className="bg-gray-100 p-1 rounded-lg">
 *   <TabsTrigger value="all">Todos</TabsTrigger>
 *   <TabsTrigger value="active">Ativos</TabsTrigger>
 *   <TabsTrigger value="archived">Arquivados</TabsTrigger>
 * </TabsList>
 *
 * @example
 * // TabsList com muitas opções
 * <TabsList className="overflow-x-auto">
 *   <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *   <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   <TabsTrigger value="tab3">Tab 3</TabsTrigger>
 *   <TabsTrigger value="tab4">Tab 4</TabsTrigger>
 *   <TabsTrigger value="tab5">Tab 5</TabsTrigger>
 * </TabsList>
 */
export interface TabsListProps {
  /**
   * Elementos TabsTrigger que representam as opções de navegação.
   * Cada trigger deve ter um value único correspondente a um TabsContent.
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para customizar a lista de tabs.
   * Útil para ajustar espaçamento, cores ou comportamento de scroll.
   */
  className?: string;
}

/**
 * Componente TabsList
 *
 * Container horizontal para os botões de navegação das tabs.
 * Renderiza uma lista com borda inferior e espaçamento adequado entre os triggers.
 * Inclui atributo role="tablist" para acessibilidade.
 *
 * @param {TabsListProps} props - Propriedades do componente
 * @returns {JSX.Element} Container flexível com role="tablist"
 */
export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex border-b border-gray-200 gap-1',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

/**
 * Propriedades do componente TabsTrigger
 *
 * @interface TabsTriggerProps
 *
 * @example
 * // TabsTrigger básico
 * <TabsTrigger value="home">Página Inicial</TabsTrigger>
 *
 * @example
 * // TabsTrigger desabilitado
 * <TabsTrigger value="premium" disabled>
 *   Premium (Em breve)
 * </TabsTrigger>
 *
 * @example
 * // TabsTrigger com ícone
 * <TabsTrigger value="settings">
 *   <SettingsIcon className="w-4 h-4 mr-2" />
 *   Configurações
 * </TabsTrigger>
 *
 * @example
 * // TabsTrigger com badge de contagem
 * <TabsTrigger value="notifications">
 *   Notificações
 *   <Badge className="ml-2">5</Badge>
 * </TabsTrigger>
 *
 * @example
 * // TabsTrigger com estilização customizada
 * <TabsTrigger value="danger" className="text-red-600 hover:text-red-700">
 *   Zona de Perigo
 * </TabsTrigger>
 */
export interface TabsTriggerProps {
  /**
   * Identificador único da tab.
   * Usado para vincular o trigger ao TabsContent correspondente.
   */
  value: string;

  /**
   * Conteúdo do botão, geralmente texto mas pode incluir ícones ou badges.
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para customizar a aparência do trigger.
   */
  className?: string;

  /**
   * Desabilita o trigger, impedindo a interação do usuário.
   * Útil para tabs que serão disponibilizadas futuramente ou condicionalmente.
   * @default false
   */
  disabled?: boolean;
}

/**
 * Componente TabsTrigger
 *
 * Botão de navegação individual que ativa uma tab específica ao ser clicado.
 * Visualmente destacado quando está ativo com borda inferior colorida.
 * Inclui estados de hover, focus e disabled, além de atributos ARIA para acessibilidade.
 *
 * @param {TabsTriggerProps} props - Propriedades do componente
 * @returns {JSX.Element} Botão interativo com role="tab"
 */
export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors relative',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-t-lg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Propriedades do componente TabsContent
 *
 * @interface TabsContentProps
 *
 * @example
 * // TabsContent básico
 * <TabsContent value="home">
 *   <h2>Bem-vindo</h2>
 *   <p>Este é o conteúdo da página inicial.</p>
 * </TabsContent>
 *
 * @example
 * // TabsContent com formulário
 * <TabsContent value="settings">
 *   <form onSubmit={handleSubmit}>
 *     <Input label="Nome de usuário" />
 *     <Input label="Email" type="email" />
 *     <Button type="submit">Salvar</Button>
 *   </form>
 * </TabsContent>
 *
 * @example
 * // TabsContent com lista de dados
 * <TabsContent value="users" className="space-y-2">
 *   {users.map(user => (
 *     <Card key={user.id}>
 *       <CardContent>
 *         {user.name}
 *       </CardContent>
 *     </Card>
 *   ))}
 * </TabsContent>
 *
 * @example
 * // TabsContent vazio com EmptyState
 * <TabsContent value="notifications">
 *   {notifications.length === 0 ? (
 *     <EmptyState
 *       title="Nenhuma notificação"
 *       description="Você está em dia!"
 *     />
 *   ) : (
 *     <NotificationList notifications={notifications} />
 *   )}
 * </TabsContent>
 *
 * @example
 * // TabsContent com padding customizado
 * <TabsContent value="preview" className="p-0">
 *   <div className="aspect-vídeo bg-gray-100 rounded">
 *     <ImagePreview src={imageUrl} />
 *   </div>
 * </TabsContent>
 */
export interface TabsContentProps {
  /**
   * Identificador único que vincula este conteúdo a um TabsTrigger.
   * Deve corresponder exatamente ao value do trigger associado.
   */
  value: string;

  /**
   * Conteúdo a ser exibido quando esta tab estiver ativa.
   * Pode incluir qualquer elemento React, como texto, formulários, listas, etc.
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para customizar o container do conteúdo.
   * Útil para ajustar padding, espaçamento ou layout específico.
   */
  className?: string;
}

/**
 * Componente TabsContent
 *
 * Painel de conteúdo que é exibido quando sua tab correspondente está ativa.
 * Renderiza o conteúdo apenas quando o value corresponde à tab ativa.
 * Inclui atributo role="tabpanel" para acessibilidade e ID vinculado ao trigger.
 *
 * @param {TabsContentProps} props - Propriedades do componente
 * @returns {JSX.Element | null} Container do conteúdo ou null quando inativo
 */
export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      className={cn('py-4', className)}
    >
      {children}
    </div>
  );
}
