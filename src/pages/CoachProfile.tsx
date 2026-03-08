import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, Users, Heart, MessageCircle, ShoppingBag, ChevronRight, Share2, Check, Calendar, Award, Clock, Play, ExternalLink, MapPin } from "lucide-react";
import { getCoachById } from "@/lib/mockData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { hapticLight, hapticSuccess, hapticMedium } from "@/lib/haptics";
import ProductDetail from "@/components/ProductDetail";
import CoachChat from "@/components/CoachChat";
import { useCart } from "@/context/CartContext";

type ActiveTab = "posts" | "products" | "packages" | "reviews";

const mockReviews = [
  { id: "r1", author: "Ahmet Y.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60", rating: 5, text: "3 ayda inanılmaz sonuçlar aldım. Her detayı düşünülmüş program.", date: "2 hafta önce" },
  { id: "r2", author: "Zeynep K.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60", rating: 5, text: "En iyi koç! Beslenme ve antrenman planı mükemmel.", date: "1 ay önce" },
  { id: "r3", author: "Burak Ş.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60", rating: 4, text: "Çok iyi program ama bazen cevap geç geliyor.", date: "2 ay önce" },
];

const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const coach = getCoachById(id || "1");
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  if (!coach) return <div className="p-4 text-center text-muted-foreground">Koç bulunamadı</div>;

  const handleFollow = () => {
    hapticMedium();
    setIsFollowing(!isFollowing);
    toast({ title: isFollowing ? "Takipten çıkıldı" : "Takip edildi ✓", description: isFollowing ? `${coach.name} takipten çıkarıldı` : `${coach.name} artık takip ediliyor` });
  };

  const handleLikePost = (postId: string) => {
    hapticLight();
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddToCart = (product: any) => {
    hapticSuccess();
    addItem({ id: product.id, name: product.title, price: product.price, image: product.image, quantity: 1, bioCoinsDiscount: product.bioCoins });
    toast({ title: "Sepete Eklendi ✓", description: `${product.title} sepete eklendi.` });
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="relative h-52 overflow-hidden">
        <img src={coach.storyContent.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm">
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-4 -mt-14 relative space-y-5">
        {/* Profile info */}
        <div className="flex items-end gap-4">
          <div className="p-1 rounded-full bg-gradient-to-tr from-primary to-primary/50">
            <Avatar className="w-20 h-20 border-2 border-background">
              <AvatarImage src={coach.avatar} />
              <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">{coach.name}</h1>
            <p className="text-primary text-xs font-display">{coach.specialty}</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">{coach.bio}</p>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-foreground font-display text-lg">{coach.students}</p>
            <p className="text-muted-foreground text-[10px]">Öğrenci</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-foreground font-display text-lg">{coach.followers}</p>
            <p className="text-muted-foreground text-[10px]">Takipçi</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <p className="text-foreground font-display text-lg">{coach.rating}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button onClick={handleFollow} className={`flex-1 h-11 font-display text-xs tracking-wider ${isFollowing ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"}`}>
            {isFollowing ? <><Check className="w-4 h-4 mr-1" /> TAKİP EDİLİYOR</> : <><Heart className="w-4 h-4 mr-1" /> TAKİP ET</>}
          </Button>
          <Button variant="outline" onClick={() => setShowChat(true)} className="h-11 px-5 border-border font-display text-xs tracking-wider">
            <MessageCircle className="w-4 h-4 mr-1" /> MESAJ
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as ActiveTab); }}>
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-border">
            <TabsTrigger value="posts" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Paylaşım</TabsTrigger>
            <TabsTrigger value="products" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ürünler</TabsTrigger>
            <TabsTrigger value="packages" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Paketler</TabsTrigger>
            <TabsTrigger value="reviews" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Yorumlar</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "posts" && (
            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {coach.posts.map(post => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
                  {post.type === "transformation" && (
                    <div className="grid grid-cols-2 h-44">
                      <div className="relative"><img src={post.beforeImage} alt="Önce" className="w-full h-full object-cover" loading="lazy" /><div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/70 text-[9px] text-foreground">Önce</div></div>
                      <div className="relative"><img src={post.afterImage} alt="Sonra" className="w-full h-full object-cover" loading="lazy" /><div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/70 text-[9px] text-foreground">Sonra</div></div>
                    </div>
                  )}
                  {post.type === "video" && (
                    <div className="relative h-44">
                      <img src={post.videoThumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center"><Play className="w-6 h-6 text-primary-foreground ml-0.5" /></div></div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-foreground text-sm">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Heart className={`w-4 h-4 ${likedPosts[post.id] ? "text-destructive fill-red-500" : ""}`} />
                        {post.likes + (likedPosts[post.id] ? 1 : 0)}
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MessageCircle className="w-4 h-4" />{post.comments}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {coach.products.length > 0 ? coach.products.map(product => (
                <motion.div key={product.id} className="glass-card overflow-hidden flex">
                  <img src={product.image} alt={product.title} className="w-24 h-24 object-cover flex-shrink-0" loading="lazy" />
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">{product.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-primary text-sm font-display">₺{product.price}</span>
                        {product.bioCoins && <span className="text-yellow-500 text-[10px]">veya {product.bioCoins} coin</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleAddToCart(product)} className="h-7 text-[10px] bg-primary hover:bg-primary/90 font-display">Sepete Ekle</Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(product)} className="h-7 text-[10px] text-primary">Detay</Button>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Henüz ürün yok</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "packages" && (
            <motion.div key="packages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {coach.packages.length > 0 ? coach.packages.map((pkg, i) => (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`glass-card p-4 relative overflow-hidden ${i === 0 ? "border-primary/30" : ""}`}>
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
                  <Button className="w-full h-10 bg-primary hover:bg-primary/90 font-display text-xs tracking-wider">
                    <Calendar className="w-4 h-4 mr-1" /> BAŞLA
                  </Button>
                </motion.div>
              )) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Henüz paket yok</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Rating summary */}
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="font-display text-3xl text-foreground">{coach.rating}</p>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.round(coach.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-[10px] mt-1">{mockReviews.length} yorum</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = mockReviews.filter(r => r.rating === star).length;
                    const pct = (count / mockReviews.length) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] w-3">{star}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-yellow-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews */}
              {mockReviews.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-8 h-8"><AvatarImage src={review.avatar} /><AvatarFallback>{review.author.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-medium">{review.author}</p>
                      <p className="text-muted-foreground text-[10px]">{review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{review.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Detail */}
      {selectedProduct && (
        <ProductDetail product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {/* Coach Chat */}
      <CoachChat isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
};

export default CoachProfile;
