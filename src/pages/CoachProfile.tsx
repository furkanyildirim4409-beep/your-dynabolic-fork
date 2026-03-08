import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Verified, Users, GraduationCap, Star, ShoppingBag, Briefcase, Grid3X3, Play, Coins, Check, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { getCoachById, coaches } from "@/lib/mockData";
import ProductDetail from "@/components/ProductDetail";
import { useStory, type Story } from "@/context/StoryContext";
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
  const { openStories } = useStory();
  const { addToCart, openCart } = useCart();
  const [activeTab, setActiveTab] = useState("feed");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [bioCoins, setBioCoins] = useState(USER_BIO_COINS);
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});

  const coach = getCoachById(coachId || "1") || coaches[0];

  const handleHighlightClick = (highlight: { id: string; title: string; thumbnail: string }) => {
    const story: Story = {
      id: highlight.id,
      title: highlight.title,
      thumbnail: highlight.thumbnail,
      content: coach.storyContent,
    };
    openStories([story], 0, {
      categoryLabel: highlight.title,
      categoryGradient: "from-primary to-primary/60",
    });
  };

  const handleAvatarStoryClick = () => {
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
    setSelectedProduct({ ...product, coachName: coach.name, coachId: coach.id });
    setShowProductDetail(true);
  };

  const handleAddToCart = (product: any, useCoins: boolean = false) => {
    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);
    addToCart({
      id: `coach-product-${product.id}-${coach.id}-${Date.now()}`,
      title: product.title,
      price: product.price,
      discountedPrice: useCoins ? Math.round(product.price - maxDiscount) : undefined,
      coinsUsed: useCoins ? coinsNeeded : undefined,
      image: product.image,
      coachName: coach.name,
      type: "product",
    });
    if (useCoins) {
      setBioCoins((prev) => prev - coinsNeeded);
      setCoinDiscounts((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Takipten Çıkıldı" : "Takip Edildi!",
      description: isFollowing ? `${coach.name} takipten çıkarıldı.` : `${coach.name} takip edilmeye başlandı.`,
    });
  };

  const handleMessage = () => {
    toast({ title: "Mesaj (Demo)", description: `${coach.name} ile mesajlaşma yakında aktif olacak!` });
  };

  const handlePackageSelect = (pkg: { id: string; title: string; price: number; description: string }) => {
    addToCart({
      id: `coach-package-${pkg.id}-${coach.id}-${Date.now()}`,
      title: pkg.title,
      price: pkg.price,
      discountedPrice: undefined,
      coinsUsed: 0,
      image: coach.avatar,
      coachName: coach.name,
      type: "coaching",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-8">
        {/* Header with Back Button */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-3 flex items-center gap-4 relative z-50">
            <button
              onClick={() => { hapticLight(); navigate(-1); }}
              className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"
              aria-label="Geri Dön"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display text-lg text-foreground flex-1">{coach.name}</h1>
            <Verified className="w-5 h-5 text-primary fill-primary" />
          </div>
        </div>

        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar with Story Ring */}
            <motion.button
              onClick={handleAvatarStoryClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-primary via-yellow-500 to-primary animate-pulse">
                <div className="p-0.5 rounded-full bg-background">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={coach.avatar} alt={coach.name} className="object-cover" />
                    <AvatarFallback className="bg-secondary text-foreground text-2xl font-display">{coach.name.charAt(4)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Play className="w-3 h-3 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
            </motion.button>

            {/* Stats */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">{coach.followers}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Users className="w-3 h-3" /> Takipçi</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">{coach.students}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Öğrenci</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-primary">{coach.rating}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" /> Puan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <p className="text-foreground text-sm leading-relaxed">{coach.bio}</p>
            <p className="text-primary text-xs mt-1 font-medium">{coach.specialty}</p>
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

        {/* Highlights */}
        <div className="px-4 py-4 border-y border-white/10">
          <h3 className="font-display text-xs text-muted-foreground mb-3 tracking-wider">ÖNE ÇIKANLAR</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {coach.highlights.map((highlight) => (
              <motion.button
                key={highlight.id}
                onClick={() => handleHighlightClick(highlight)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary/50 to-primary/30">
                  <div className="p-0.5 rounded-full bg-background">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <img src={highlight.thumbnail} alt={highlight.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                <p className="text-foreground text-[10px] font-medium truncate w-16 text-center">{highlight.title}</p>
              </motion.button>
            ))}
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
            {coach.posts.map((post) => {
              const isLiked = likedPosts[post.id];
              const displayLikes = isLiked ? post.likes + 1 : post.likes;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                  {post.type === "transformation" && (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                        <img src={post.beforeImage} alt="Önce" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">ÖNCE</span>
                      </div>
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden border-l-2 border-primary/50">
                        <img src={post.afterImage} alt="Sonra" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">SONRA</span>
                      </div>
                    </div>
                  )}
                  {post.type === "video" && post.videoThumbnail && (
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img src={post.videoThumbnail} alt="Video" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4"><p className="text-foreground text-sm">{post.content}</p></div>
                  <div className="px-4 pb-4 flex items-center gap-6">
                    <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 transition-colors ${isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-destructive" : ""}`} />
                      <span className="text-xs">{displayLikes.toLocaleString()}</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-5 h-5" /><span className="text-xs">{post.comments}</span>
                    </button>
                    <button onClick={() => toast({ title: "Link Kopyalandı (Demo)" })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
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
              {coach.products.map((product) => {
                const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
                const isDiscountActive = coinDiscounts[product.id] || false;
                const coinsNeeded = calculateCoinsNeeded(maxDiscount);
                const discountedPrice = product.price - maxDiscount;

                return (
                  <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card overflow-hidden">
                    <div className="aspect-square bg-muted relative cursor-pointer" onClick={() => handleProductClick(product)}>
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
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
              })}
            </div>
          </TabsContent>

          {/* Coaching Tab */}
          <TabsContent value="coaching" className="mt-0 p-4 space-y-4">
            {/* No Bio-Coin Warning */}
            <div className="glass-card p-3 flex items-center gap-2 bg-amber-500/10 border-amber-500/20">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-400/80 text-[10px]">Bio-Coin koçluk hizmetlerinde kullanılamaz.</p>
            </div>

            {coach.packages.map((pkg, i) => (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass-card p-4 relative overflow-hidden ${i === 0 ? "border-primary/30" : ""}`}>
                {i === 0 && <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-primary text-primary-foreground text-[10px] font-display">EN POPÜLER</div>}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm text-foreground">{pkg.title}</h3>
                  <div className="text-right">
                    <span className="text-primary font-display text-xl">₺{pkg.price.toLocaleString()}</span>
                    <p className="text-muted-foreground text-[10px]">/ay</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs mb-3">{pkg.description}</p>
                <div className="space-y-1.5 mb-4">
                  {pkg.features.map((f: string, fi: number) => (
                    <p key={fi} className="text-muted-foreground text-[10px] flex items-center gap-2">
                      <Check className="w-3 h-3 text-primary flex-shrink-0" /> {f}
                    </p>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePackageSelect(pkg)}
                  className="w-full py-3 bg-primary text-primary-foreground font-display text-xs tracking-wider rounded-xl neon-glow"
                >
                  SEPETE EKLE
                </motion.button>
              </motion.div>
            ))}
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
