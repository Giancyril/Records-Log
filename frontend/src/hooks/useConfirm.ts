import { useState } from "react";

interface ConfirmOptions {
  title:        string;
  message:      string;
  confirmText?: string;
  cancelText?:  string;
  variant?:     "danger" | "info" | "warning";
}

export const useConfirm = () => {
  const [isOpen,  setIsOpen]  = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "", message: "", confirmText: "Confirm", cancelText: "Cancel", variant: "danger",
  });
  const [resolve, setResolve] = useState<(val: boolean) => void>(() => () => {});

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions({ confirmText: "Confirm", cancelText: "Cancel", variant: "danger", ...opts });
    setIsOpen(true);
    return new Promise(res => setResolve(() => res));
  };

  const handleConfirm = () => { setIsOpen(false); resolve(true); };
  const handleCancel  = () => { setIsOpen(false); resolve(false); };

  return { confirm, isOpen, options, handleConfirm, handleCancel };
};