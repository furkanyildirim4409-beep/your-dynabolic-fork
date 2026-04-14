import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Globe, X, Heart, MessageCircle, Share2, Verified, Coins, Trophy, Star, Users, Shield, ShoppingBag } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCoachStories, useLeaderboardCoaches, type CoachStoryRow } from "@/hooks/useDiscoveryData";
import { useCoachProducts } from "@/hooks/useStoreData";
import type { CoachProduct } from "@/types/shared-models";
import ProductDetail from "@/components/ProductDetail";
import { useStory, type Story } from "@/context/StoryContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import BioCoinWallet from "@/components/BioCoinWallet";
import BioCoinTransactionHistory from "@/components/BioCoinTransactionHistory";
import { useSocialPosts, useToggleLike } from "@/hooks/useSocialFeed";
import { useMyViewedStoryIds, useMarkStoryViewed } from "@/hooks/useStoryViews";

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



const Kesfet = () => {
  const navigate = useNavigate();
  const { openStories } = useStory();
  const { addToCart, cartCount, openCart } = useCart();
  const { profile, user, refreshProfile } = useAuth();
  const bioCoins = profile?.bio_coins ?? 0;
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  const { data: livePosts, isLoading: feedLoading } = useSocialPosts();
  const { mutate: toggleLike } = useToggleLike();
  const { data: liveStories, isLoading: storiesLoading } = useCoachStories();
  const { data: liveLeaderboard, isLoading: leaderboardLoading } = useLeaderboardCoaches();
  const { data: liveProducts, isLoading: productsLoading } = useCoachProducts();
  const { data: viewedStoryIds } = useMyViewedStoryIds();
  const markViewed = useMarkStoryViewed();

  // Deduplicate stories by coach_id
  const uniqueCoachStories = (liveStories ?? []).reduce<CoachStoryRow[]>((acc, s) => {
    if (!acc.find(x => x.coach_id === s.coach_id)) acc.push(s);
    return acc;
  }, []);

  const handleCoachClick = (coachId: string) => {
    navigate(`/coach/${coachId}`);
  };

  const handleStoryClick = (storyRow: CoachStoryRow) => {
    // Get ALL active stories for this coach
    const coachAllStories = (liveStories ?? []).filter(s => s.coach_id === storyRow.coach_id);
    const mapped: Story[] = coachAllStories.map((s) => ({
      id: s.id,
      title: s.coach.full_name,
      thumbnail: s.coach.avatar_url || "",
      content: { image: s.media_url, text: "" },
    }));
    openStories(mapped, 0, {
      categoryLabel: storyRow.coach.full_name,
      categoryGradient: "from-primary to-primary/60",
    });
    markViewed.mutate(coachAllStories.map(s => s.id));
  };


  const handleProductClick = (product: CoachProduct) => {
    setSelectedProduct({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image_url,
      type: "product",
      coachName: product.coach?.full_name || "Koç",
      coachId: product.coach_id,
    });
    setShowProductDetail(true);
  };

  const handleAddToCart = async (product: any) => {
    const coachId = product.coach_id ?? product.coachId;
    const discountKey = product.id + coachId;
    const isDiscountActive = coinDiscounts[discountKey] || false;
    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);

    if (isDiscountActive && bioCoins < coinsNeeded) {
      toast.error("Yetersiz bakiye!", { description: "Yeterli Bio-Coin'iniz bulunmuyor." });
      return;
    }

    addToCart({
      id: `${product.id}-${coachId}-${Date.now()}`,
      title: product.title,
      price: product.price,
      discountedPrice: isDiscountActive ? Math.round(product.price - maxDiscount) : undefined,
      coinsUsed: isDiscountActive ? coinsNeeded : undefined,
      image: product.image_url ?? product.image,
      coachName: product.coach?.full_name ?? product.coachName ?? "Koç",
      type: "product",
    });

    if (isDiscountActive && user) {
      const newBalance = bioCoins - coinsNeeded;
      await supabase.from("profiles").update({ bio_coins: newBalance }).eq("id", user.id);

      await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount: -coinsNeeded,
        type: "purchase",
        description: `${product.title} indirimi`,
      });

      await refreshProfile();
      setCoinDiscounts(prev => ({ ...prev, [discountKey]: false }));
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
            <div onClick={() => setShowTransactionHistory(true)} className="cursor-pointer">
              <BioCoinWallet balance={bioCoins} />
            </div>
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
            {storiesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))
            ) : uniqueCoachStories.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4">Takip ettiğiniz koçların henüz aktif bir hikayesi yok.</p>
            ) : (
              uniqueCoachStories.map((storyRow) => {
                const coachStoryIds = (liveStories ?? []).filter(s => s.coach_id === storyRow.coach_id).map(s => s.id);
                const allWatched = coachStoryIds.every(id => viewedStoryIds?.includes(id));
                return (
                  <motion.button
                    key={storyRow.coach_id}
                    onClick={() => handleStoryClick(storyRow)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                  >
                    <div className={allWatched
                      ? "p-0.5 rounded-full border-2 border-muted-foreground/30"
                      : "p-0.5 rounded-full bg-gradient-to-tr from-primary to-primary/60"
                    }>
                      <div className="p-0.5 rounded-full bg-background">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={storyRow.coach.avatar_url || ""} alt={storyRow.coach.full_name} className="object-cover" />
                          <AvatarFallback className="bg-secondary text-foreground">{storyRow.coach.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-foreground text-xs font-medium truncate w-16">{storyRow.coach.full_name.split(" ")[0]}</p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs defaultValue="akis" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-white/5">
            <TabsTrigger value="akis" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AKIŞ</TabsTrigger>
            <TabsTrigger value="koclar" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">KOÇLAR</TabsTrigger>
            <TabsTrigger value="magaza" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">MAĞAZA</TabsTrigger>
          </TabsList>

          <TabsContent value="akis" className="mt-4">
            <div className="space-y-4">
              {feedLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <div className="p-4 flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="mx-4 aspect-video rounded-lg" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="px-4 pb-4 flex items-center gap-6">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                ))
              ) : (livePosts ?? []).length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <p className="text-muted-foreground text-sm">Henüz paylaşım yok.</p>
                </div>
              ) : (
                (livePosts ?? []).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card overflow-hidden"
                  >
                    <button
                      onClick={() => handleCoachClick(post.coach_id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.coach?.avatar_url || ""} alt={post.coach?.full_name || ""} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary">{(post.coach?.full_name || "K").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-foreground text-sm font-medium">{post.coach?.full_name || "Koç"}</span>
                          <Verified className="w-4 h-4 text-primary fill-primary" />
                        </div>
                        <span className="text-muted-foreground text-xs">Elit Koç</span>
                      </div>
                    </button>

                    {post.type === "transformation" && post.before_image_url && post.after_image_url && (
                      <div className="grid grid-cols-2 gap-1 px-4">
                        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                          <img src={post.before_image_url} alt="Önce" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">ÖNCE</span>
                        </div>
                        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border-2 border-primary/50">
                          <img src={post.after_image_url} alt="Sonra" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">SONRA</span>
                        </div>
                      </div>
                    )}

                    {post.type === "video" && post.video_thumbnail_url && (
                      <div className="relative aspect-video mx-4 bg-muted rounded-lg overflow-hidden">
                        <img src={post.video_thumbnail_url} alt="Video" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {post.type === "image" && post.image_url && (
                      <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}

                    {post.type !== "transformation" && post.type !== "video" && !post.image_url && post.before_image_url && (
                      <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
                        <img src={post.before_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}

                    <div className="p-4">
                      <p className="text-foreground text-sm">{post.content}</p>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-6">
                      <button
                        onClick={() => toggleLike({ postId: post.id, isCurrentlyLiked: post.user_has_liked })}
                        className={`flex items-center gap-2 transition-colors ${post.user_has_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
                      >
                        <Heart className={`w-5 h-5 ${post.user_has_liked ? "fill-destructive" : ""}`} />
                        <span className="text-xs">{post.likes_count.toLocaleString()}</span>
                      </button>
                      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-xs">0</span>
                      </button>
                      <button
                        onClick={() => toast("Link Kopyalandı (Demo)")}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* KOÇLAR (Leaderboard) Tab */}
          <TabsContent value="koclar" className="mt-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-display text-sm text-foreground tracking-wide">KOÇLAR LİGİ</h2>
              </div>
              {leaderboardLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="glass-card p-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-14 h-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))
              ) : (liveLeaderboard ?? []).map((coach, index) => {
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
                      <p className="font-display text-lg text-primary">{coach.score.toLocaleString()}</p>
                      <p className="text-muted-foreground text-[10px]">puan</p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </TabsContent>

          {/* MAĞAZA Tab */}
          <TabsContent value="magaza" className="mt-4">
            {/* Bio-Coin Balance */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-foreground text-sm">Bakiyen:</span>
              </div>
              <span className="font-display text-lg text-primary">{bioCoins.toLocaleString()} BIO</span>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {productsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              ) : (liveProducts ?? []).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground col-span-2">
                  Şu an mağazada ürün bulunmuyor.
                </div>
              ) : (liveProducts ?? []).map((product, index) => {
                const discountKey = product.id + product.coach_id;
                const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
                const isDiscountActive = coinDiscounts[discountKey] || false;
                const coinsNeeded = calculateCoinsNeeded(maxDiscount);
                const discountedPrice = product.price - maxDiscount;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card overflow-hidden"
                  >
                    <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => handleProductClick(product)}>
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      {isDiscountActive && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">-{Math.round(maxDiscount)}₺</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-foreground text-xs font-medium line-clamp-1">{product.title}</p>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{product.coach?.full_name || "Koç"}</p>
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
                            onCheckedChange={(checked) => setCoinDiscounts(prev => ({ ...prev, [discountKey]: checked }))}
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

      <BioCoinTransactionHistory
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
    </>
  );
};

export default Kesfet;
