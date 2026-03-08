import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const FloatingCartButton = () => {
  const { cartCount, cartTotal, openCart } = useCart();

  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openCart}
        className="fixed bottom-36 right-4 z-[100] bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 px-4 py-3"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
            {cartCount}
          </span>
        </div>
        <span className="font-display text-sm">
          {cartTotal}₺
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default FloatingCartButton;