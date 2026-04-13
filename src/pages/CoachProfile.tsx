import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Verified, Users, GraduationCap, Star, ShoppingBag, Briefcase, Grid3X3, Play, Coins, Check, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCoachDetail, useCoachPosts, useCoachDetailProducts } from "@/hooks/useCoachDetail";
import { useToggleLike } from "@/hooks/useSocialFeed";
import ProductDetail from "@/components/ProductDetail";
import { useCart } from "@/context/CartContext";
import { hapticLight } from "@/lib/haptics";

// Bio-Coin Constants (GLOBAL RULE: Max 20% discount)
const COIN_TO_TL_RATE = 0.1;
const MAX_DISCOUNT_PERCENTAGE = 0.20;
const USER_BIO_COINS = 2450;

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

const CoachProfile = () => {
  const navigate = useNavigate();
  const { coachId } = useParams();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [bioCoins, setBioCoins] = useState(USER_BIO_COINS);
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});

  // Live data hooks
  const { data: profile, isLoading: profileLoading } = useCoachDetail(coachId);
  const { data: posts, isLoading: postsLoading } = useCoachPosts(coachId);
  const { data: products, isLoading: productsLoading } = useCoachDetailProducts(coachId);
  const toggleLike = useToggleLike();

  const coachName = profile?.full_name || "Koç";
  const coachAvatar = profile?.avatar_url || "";
  const coachInitial = coachName.charAt(0);

  const [isFollowing, setIsFollowing] = useState(false);

  const handleLike = (postId: string, isCurrentlyLiked: boolean) => {
    toggleLike.mutate({ postId, isCurrentlyLiked });
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct({ ...product, coachName, coachId: coachId });
    setShowProductDetail(true);
  };

  const handleAddToCart = (product: any, useCoins: boolean = false) => {
    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);
    addToCart({
      id: `coach-product-${product.id}-${coachId}-${Date.now()}`,
      title: product.title,
      price: product.price,
      discountedPrice: useCoins ? Math.round(product.price - maxDiscount) : undefined,
      coinsUsed: useCoins ? coinsNeeded : undefined,
      image: product.image_url,
      coachName,
      type: "product",
    });
    if (useCoins) {
      setBioCoins((prev) => prev - coinsNeeded);
      setCoinDiscounts((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast(isFollowing ? "Takipten Çıkıldı" : "Takip Edildi!", {
      description: isFollowing ? `${coachName} takipten çıkarıldı.` : `${coachName} takip edilmeye başlandı.`,
    });
  };

  const handleMessage = () => {
    toast("Mesaj (Demo)", { description: `${coachName} ile mesajlaşma yakında aktif olacak!` });
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-3 flex items-center gap-4 relative z-50">
            <button
              onClick={() => { hapticLight(); navigate(-1); }}
              className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"
              aria-label="Geri Dön"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            {profileLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <h1 className="font-display text-lg text-foreground flex-1">{coachName}</h1>
            )}
            <Verified className="w-5 h-5 text-primary fill-primary" />
          </div>
        </div>

        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {profileLoading ? (
              <Skeleton className="w-24 h-24 rounded-full" />
            ) : (
              <div className="relative">
                <div className="p-1 rounded-full bg-gradient-to-tr from-primary via-yellow-500 to-primary">
                  <div className="p-0.5 rounded-full bg-background">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={coachAvatar} alt={coachName} className="object-cover" />
                      <AvatarFallback className="bg-secondary text-foreground text-2xl font-display">{coachInitial}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">0</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Takipçi</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">0</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Öğrenci</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-primary">4.9</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" /> Puan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            {profileLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <p className="text-foreground text-sm leading-relaxed">{profile?.bio || "Henüz biyografi eklenmemiş."}</p>
                {profile?.specialty && <p className="text-primary text-xs mt-1 font-medium">{profile.specialty}</p>}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFollow}
              className={`flex-1 py-3 font-display text-sm rounded-xl flex items-center justify-center gap-2 ${isFollowing ? "bg-secondary text-foreground border border-white/10" : "bg-primary text-primary-foreground neon-glow"}`}
            >
              {isFollowing && <Check className="w-4 h-4" />}
              {isFollowing ? "TAKİP EDİLİYOR" : "TAKİP ET"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMessage}
              className="flex-1 py-3 bg-secondary text-foreground font-display text-sm rounded-xl border border-white/10"
            >
              MESAJ GÖNDER
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-transparent border-b border-white/10 rounded-none h-12 p-0">
            <TabsTrigger value="feed" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-display text-xs tracking-wider">
              <Grid3X3 className="w-4 h-4 mr-2" />AKIŞ
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-display text-xs tracking-wider">
              <ShoppingBag className="w-4 h-4 mr-2" />MAĞAZA
            </TabsTrigger>
            <TabsTrigger value="coaching" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-display text-xs tracking-wider">
              <Briefcase className="w-4 h-4 mr-2" />KOÇLUK
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-0 p-4 space-y-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : (posts ?? []).length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">Henüz gönderi yok.</div>
            ) : (
              (posts ?? []).map((post) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                  {post.type === "transformation" && (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                        <img src={post.before_image_url || ""} alt="Önce" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">ÖNCE</span>
                      </div>
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden border-l-2 border-primary/50">
                        <img src={post.after_image_url || ""} alt="Sonra" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">SONRA</span>
                      </div>
                    </div>
                  )}
                  {post.type === "video" && post.video_thumbnail_url && (
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img src={post.video_thumbnail_url} alt="Video" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4"><p className="text-foreground text-sm">{post.content}</p></div>
                  <div className="px-4 pb-4 flex items-center gap-6">
                    <button onClick={() => handleLike(post.id, post.user_has_liked)} className={`flex items-center gap-2 transition-colors ${post.user_has_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                      <Heart className={`w-5 h-5 ${post.user_has_liked ? "fill-destructive" : ""}`} />
                      <span className="text-xs">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-5 h-5" /><span className="text-xs">0</span>
                    </button>
                    <button onClick={() => toast("Link Kopyalandı (Demo)")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Shop Tab */}
          <TabsContent value="shop" className="mt-0 p-4">
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
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (products ?? []).length === 0 ? (
                <div className="text-center p-8 text-muted-foreground col-span-2">Mağazada ürün bulunmuyor.</div>
              ) : (
                (products ?? []).map((product) => {
                  const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
                  const isDiscountActive = coinDiscounts[product.id] || false;
                  const coinsNeeded = calculateCoinsNeeded(maxDiscount);
                  const discountedPrice = product.price - maxDiscount;

                  return (
                    <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card overflow-hidden">
                      <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => handleProductClick(product)}>
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                        {isDiscountActive && (
                          <div className="absolute top-2 left-2"><span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">-{Math.round(maxDiscount)}₺</span></div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-foreground text-xs font-medium line-clamp-1">{product.title}</p>
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
                              onCheckedChange={(checked) => setCoinDiscounts(prev => ({ ...prev, [product.id]: checked }))}
                              className="scale-75"
                            />
                          </div>
                        )}
                        {isDiscountActive && hasExcessCoins(product.price, bioCoins) && (
                          <p className="text-[8px] text-primary/70 italic mt-1">Maksimum %20 indirim uygulanabilir</p>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddToCart(product, isDiscountActive)}
                          className="w-full mt-2 text-[10px] py-1.5 rounded-lg font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 flex items-center justify-center gap-1"
                        >
                          <ShoppingBag className="w-3 h-3" />SEPETE EKLE
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Coaching Tab */}
          <TabsContent value="coaching" className="mt-0 p-4 space-y-4">
            <div className="glass-card p-3 flex items-center gap-2 bg-amber-500/10 border-amber-500/20">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-400/80 text-[10px]">Bio-Coin koçluk hizmetlerinde kullanılamaz.</p>
            </div>
            <div className="text-center p-8 text-muted-foreground">
              Koçluk paketleri yakında aktif olacak.
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

export default CoachProfile;
