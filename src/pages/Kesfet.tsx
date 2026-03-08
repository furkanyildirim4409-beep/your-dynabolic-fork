import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Globe, X, Heart, MessageCircle, Share2, Verified, Coins, Trophy, Star, Users, Shield, ShoppingBag } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { coaches, getLeaderboardCoaches, Coach } from "@/lib/mockData";
import ProductDetail from "@/components/ProductDetail";
import { useStory, type Story } from "@/context/StoryContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SupplementShop from "@/components/SupplementShop";
import BioCoinWallet from "@/components/BioCoinWallet";
import BioCoinTransactionHistory from "@/components/BioCoinTransactionHistory";

// Bio-Coin Discount Calculator (GLOBAL RULE: Max 20% discount)
const COIN_TO_TL_RATE = 0.1;
const MAX_DISCOUNT_PERCENTAGE = 0.20;

const calculateMaxDiscount = (productPrice: number, userCoins: number): number => {
  const maxAllowedByPercentage = productPrice * MAX_DISCOUNT_PERCENTAGE;
  const maxPossibleFromCoins = userCoins * COIN_TO_TL_RATE;
  return Math.min(maxPossibleFromCoins, maxAllowedByPercentage);
};

const calculateCoinsNeeded = (discountAmount: number): number => {
  return Math.ceil(discountAmount / COIN_TO_TL_RATE);
};

const hasExcessCoins = (productPrice: number, userCoins: number): boolean => {
  const maxAllowedByPercentage = productPrice * MAX_DISCOUNT_PERCENTAGE;
  const maxPossibleFromCoins = userCoins * COIN_TO_TL_RATE;
  return maxPossibleFromCoins > maxAllowedByPercentage;
};

const getMedalBadge = (rank: number) => {
  if (rank === 1) return { emoji: "🥇", color: "from-yellow-400 to-yellow-600", glow: "shadow-[0_0_20px_rgba(250,204,21,0.5)]" };
  if (rank === 2) return { emoji: "🥈", color: "from-gray-300 to-gray-400", glow: "shadow-[0_0_15px_rgba(156,163,175,0.4)]" };
  if (rank === 3) return { emoji: "🥉", color: "from-amber-600 to-amber-700", glow: "shadow-[0_0_15px_rgba(217,119,6,0.4)]" };
  return null;
};

const getAllProducts = () => {
  return coaches.flatMap(coach =>
    coach.products.map(product => ({
      ...product,
      coachName: coach.name,
      coachId: coach.id
    }))
  ).slice(0, 8);
};

const getAllPosts = () => {
  return coaches.flatMap(coach =>
    coach.posts.map(post => ({
      ...post,
      coachName: coach.name,
      coachId: coach.id,
      coachAvatar: coach.avatar
    }))
  );
};

const Kesfet = () => {
  const navigate = useNavigate();
  const { openStories } = useStory();
  const { addToCart, cartCount, openCart } = useCart();
  const { profile, user, refreshProfile } = useAuth();
  const bioCoins = profile?.bio_coins ?? 0;
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  const sortedCoaches = getLeaderboardCoaches();
  const allProducts = getAllProducts();
  const allPosts = getAllPosts();

  const handleCoachClick = (coachId: string) => {
    navigate(`/coach/${coachId}`);
  };

  const handleStoryClick = (coach: Coach) => {
    const story: Story = {
      id: `coach-${coach.id}`,
      title: coach.name,
      thumbnail: coach.avatar,
      content: coach.storyContent,
    };
    openStories([story], 0, {
      categoryLabel: coach.specialty,
      categoryGradient: "from-primary to-primary/60",
    });
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleAddToCart = async (product: any) => {
    const isDiscountActive = coinDiscounts[product.id + product.coachId] || false;
    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);

    if (isDiscountActive && bioCoins < coinsNeeded) {
      toast({ title: "Yetersiz bakiye!", description: "Yeterli Bio-Coin'iniz bulunmuyor.", variant: "destructive" });
      return;
    }

    addToCart({
      id: `${product.id}-${product.coachId}-${Date.now()}`,
      title: product.title,
      price: product.price,
      discountedPrice: isDiscountActive ? Math.round(product.price - maxDiscount) : undefined,
      coinsUsed: isDiscountActive ? coinsNeeded : undefined,
      image: product.image,
      coachName: product.coachName,
      type: "product",
    });

    if (isDiscountActive && user) {
      const newBalance = bioCoins - coinsNeeded;
      await supabase.from("profiles").update({ bio_coins: newBalance }).eq("id", user.id);

      // Log spend transaction
      await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount: -coinsNeeded,
        type: "purchase",
        description: `${product.title} indirimi`,
      });

      await refreshProfile();
      setCoinDiscounts(prev => ({ ...prev, [product.id + product.coachId]: false }));
    }
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">KEŞFET</h1>
            <p className="text-muted-foreground text-sm">Pazar Yeri & Sosyal Ağ</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openCart()}
              className="relative p-2"
            >
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              {cartCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-[10px] font-bold">{cartCount}</span>
                </div>
              )}
            </motion.button>
            <BioCoinWallet balance={bioCoins} />
          </div>
        </div>

        {/* Elite Coaches Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-display text-sm text-foreground tracking-wide">ELİT KOÇLAR</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {coaches.map((coach) => (
              <motion.button
                key={coach.id}
                onClick={() => handleStoryClick(coach)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className={`p-0.5 rounded-full ${coach.hasNewStory ? "bg-gradient-to-tr from-primary via-yellow-500 to-primary" : "bg-muted"}`}>
                  <div className="p-0.5 rounded-full bg-background">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={coach.avatar} alt={coach.name} className="object-cover" />
                      <AvatarFallback className="bg-secondary text-foreground">{coach.name.charAt(4)}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-foreground text-xs font-medium truncate w-16">{coach.name}</p>
                  <p className="text-muted-foreground text-[10px]">{coach.specialty.split(" ")[0]}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs defaultValue="akis" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-white/5">
            <TabsTrigger value="akis" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AKIŞ</TabsTrigger>
            <TabsTrigger value="koclar" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">KOÇLAR</TabsTrigger>
            <TabsTrigger value="magaza" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">MAĞAZA</TabsTrigger>
          </TabsList>

          {/* AKIŞ (Feed) Tab */}
          <TabsContent value="akis" className="mt-4">
            <div className="space-y-4">
              {allPosts.map((post, index) => {
                const isLiked = likedPosts[post.id + post.coachId];
                const displayLikes = isLiked ? post.likes + 1 : post.likes;
                return (
                  <motion.div
                    key={`${post.id}-${post.coachId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card overflow-hidden"
                  >
                    <button
                      onClick={() => handleCoachClick(post.coachId)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.coachAvatar} alt={post.coachName} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary">{post.coachName.charAt(4)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-foreground text-sm font-medium">{post.coachName}</span>
                          <Verified className="w-4 h-4 text-primary fill-primary" />
                        </div>
                        <span className="text-muted-foreground text-xs">Elit Koç</span>
                      </div>
                    </button>

                    {post.type === "transformation" && (
                      <div className="grid grid-cols-2 gap-1 px-4">
                        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                          <img src={post.beforeImage} alt="Önce" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">ÖNCE</span>
                        </div>
                        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border-2 border-primary/50">
                          <img src={post.afterImage} alt="Sonra" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">SONRA</span>
                        </div>
                      </div>
                    )}

                    {post.type === "video" && post.videoThumbnail && (
                      <div className="relative aspect-video mx-4 bg-muted rounded-lg overflow-hidden">
                        <img src={post.videoThumbnail} alt="Video" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <p className="text-foreground text-sm">{post.content}</p>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post.id + post.coachId)}
                        className={`flex items-center gap-2 transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? "fill-destructive" : ""}`} />
                        <span className="text-xs">{displayLikes.toLocaleString()}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs">{post.comments}</span>
                      </button>
                      <button
                        onClick={() => toast({ title: "Link Kopyalandı (Demo)" })}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* KOÇLAR (Leaderboard) Tab */}
          <TabsContent value="koclar" className="mt-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm text-foreground tracking-wide">KOÇLAR LİGİ</h2>
              </div>
              {sortedCoaches.map((coach, index) => {
                const rank = index + 1;
                const medal = getMedalBadge(rank);
                return (
                  <motion.button
                    key={coach.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCoachClick(coach.id)}
                    className={`w-full glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-all ${medal ? medal.glow : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${medal ? `bg-gradient-to-br ${medal.color}` : "bg-secondary"}`}>
                      {medal ? <span className="text-xl">{medal.emoji}</span> : <span className="font-display text-sm text-foreground">#{rank}</span>}
                    </div>
                    <div className="relative">
                      <Avatar className={`w-14 h-14 ${rank === 1 ? "ring-2 ring-offset-2 ring-offset-background ring-yellow-500" : rank === 2 ? "ring-2 ring-offset-2 ring-offset-background ring-gray-400" : rank === 3 ? "ring-2 ring-offset-2 ring-offset-background ring-amber-600" : ""}`}>
                        <AvatarImage src={coach.avatar} alt={coach.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary font-display">{coach.name.split(" ")[1]?.charAt(0) || coach.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {rank <= 3 && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-full font-bold">TOP{rank}</div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-display text-sm">{coach.name}</span>
                        <Verified className="w-4 h-4 text-primary fill-primary" />
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" />{coach.rating}</span>
                        <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Users className="w-3 h-3" />{coach.students}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-primary">{coach.score}</p>
                      <p className="text-muted-foreground text-[10px]">puan</p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </TabsContent>

          {/* MAĞAZA Tab */}
          <TabsContent value="magaza" className="mt-4">
            <Tabs defaultValue="urunler" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-white/5 mb-4">
                <TabsTrigger value="urunler" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">ÜRÜNLER</TabsTrigger>
                <TabsTrigger value="supplementler" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">SUPPLEMENTLER</TabsTrigger>
              </TabsList>

              <TabsContent value="urunler">
                {/* Bio-Coin Balance */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    <span className="text-foreground text-sm">Bakiyen:</span>
                  </div>
                  <span className="font-display text-lg text-primary">{bioCoins.toLocaleString()} BIO</span>
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  {allProducts.map((product, index) => {
                    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
                    const isDiscountActive = coinDiscounts[product.id + product.coachId] || false;
                    const coinsNeeded = calculateCoinsNeeded(maxDiscount);
                    const discountedPrice = product.price - maxDiscount;

                    return (
                      <motion.div
                        key={`${product.id}-${product.coachId}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-card overflow-hidden"
                      >
                        <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => handleProductClick(product)}>
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                          {isDiscountActive && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">-{Math.round(maxDiscount)}₺</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-foreground text-xs font-medium line-clamp-1">{product.title}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{product.coachName}</p>
                          <div className="flex items-center justify-between mt-2">
                            {isDiscountActive ? (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground text-xs line-through">{product.price}₺</span>
                                <span className="text-primary font-display text-sm">{Math.round(discountedPrice)}₺</span>
                              </div>
                            ) : (
                              <span className="text-primary font-display text-sm">{product.price}₺</span>
                            )}
                          </div>
                          {maxDiscount > 0 && (
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Coins className="w-3 h-3 text-primary" />
                                <span className="text-[10px] text-muted-foreground">Bio-Coin</span>
                              </div>
                              <Switch
                                checked={isDiscountActive}
                                onCheckedChange={(checked) => setCoinDiscounts(prev => ({ ...prev, [product.id + product.coachId]: checked }))}
                                className="scale-75"
                              />
                            </div>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddToCart(product)}
                            className="w-full mt-2 text-[10px] py-1.5 rounded-lg font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            SEPETE EKLE
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="supplementler">
                <SupplementShop />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          isOpen={showProductDetail}
          onClose={() => { setShowProductDetail(false); setSelectedProduct(null); }}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
};

export default Kesfet;
