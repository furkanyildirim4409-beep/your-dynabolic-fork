import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Users, Heart, MessageCircle, ShoppingBag, ChevronRight } from "lucide-react";
import { getCoachById } from "@/lib/mockData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const CoachProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const coach = getCoachById(id || "1");

  if (!coach) return <div className="p-4 text-center text-muted-foreground">Koç bulunamadı</div>;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <img src={coach.storyContent.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-4 -mt-12 relative space-y-6">
        {/* Profile info */}
        <div className="flex items-end gap-4">
          <Avatar className="w-20 h-20 border-2 border-primary/30">
            <AvatarImage src={coach.avatar} />
            <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">{coach.name}</h1>
            <p className="text-primary text-xs">{coach.specialty}</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">{coach.bio}</p>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-xs flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{coach.rating}</span>
          <span className="text-muted-foreground text-xs flex items-center gap-1"><Users className="w-3 h-3" />{coach.students} öğrenci</span>
          <span className="text-muted-foreground text-xs flex items-center gap-1"><Heart className="w-3 h-3" />{coach.followers}</span>
        </div>

        {/* Posts */}
        <div>
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Paylaşımlar</h2>
          <div className="space-y-3">
            {coach.posts.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
                {post.type === "transformation" && (
                  <div className="grid grid-cols-2 h-40">
                    <img src={post.beforeImage} alt="Önce" className="w-full h-full object-cover" loading="lazy" />
                    <img src={post.afterImage} alt="Sonra" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                {post.type === "video" && (
                  <div className="relative h-40">
                    <img src={post.videoThumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">▶</div></div>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-foreground text-sm">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-muted-foreground text-xs">❤️ {post.likes}</span>
                    <span className="text-muted-foreground text-xs">💬 {post.comments}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Products */}
        {coach.products.length > 0 && (
          <div>
            <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Ürünler</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {coach.products.map(product => (
                <div key={product.id} className="glass-card min-w-[160px] overflow-hidden flex-shrink-0">
                  <img src={product.image} alt={product.title} className="w-full h-24 object-cover" loading="lazy" />
                  <div className="p-3">
                    <p className="text-foreground text-xs font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary text-sm font-display">₺{product.price}</span>
                      {product.bioCoins && <span className="text-yellow-500 text-[10px]">{product.bioCoins} coin</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packages */}
        {coach.packages.length > 0 && (
          <div>
            <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Paketler</h2>
            <div className="space-y-3">
              {coach.packages.map(pkg => (
                <div key={pkg.id} className="glass-card-premium p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-sm text-foreground">{pkg.title}</h3>
                    <span className="text-primary font-display text-lg">₺{pkg.price.toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-3">{pkg.description}</p>
                  <div className="space-y-1">
                    {pkg.features.map((f, i) => (
                      <p key={i} className="text-muted-foreground text-[10px] flex items-center gap-1">✓ {f}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachProfile;
