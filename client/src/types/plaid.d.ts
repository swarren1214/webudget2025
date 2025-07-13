interface PlaidLinkHandler {
  open: () => void;
  exit: (options?: { force?: boolean }) => void;
  destroy: () => void;
}

interface PlaidLinkOptions {
  token: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
  onEvent?: (eventName: string, metadata: any) => void;
  onLoad?: () => void;
  receivedRedirectUri?: string;
}

interface PlaidStatic {
  create: (options: PlaidLinkOptions) => PlaidLinkHandler;
}

declare interface Window {
  Plaid: PlaidStatic;
}