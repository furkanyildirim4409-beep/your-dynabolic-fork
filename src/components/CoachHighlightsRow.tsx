import { motion } from "framer-motion";
import { useCoachHighlights } from "@/hooks/useCoachDetail";
import { useStory } from "@/context/StoryContext";

interface CoachHighlightsRowProps {
  coachId: string;
}

const CoachHighlightsRow = ({ coachId }: CoachHighlightsRowProps) => {
  const { data: highlights, isLoading } = useCoachHighlights(coachId);
  const { openStories } = useStory();

  if (isLoading) return null;
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="border-b border-white/5">
      <div className="flex gap-4 overflow-x-auto py-4 px-4 [&::-webkit-scrollbar]:hidden">
        {highlights.map((highlight, index) => (
          <motion.button
            key={highlight.category}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
            onClick={() =>
              openStories(
                highlight.stories.map((s) => ({
                  id: s.id,
                  title: highlight.category,
                  thumbnail: s.media_url,
                  content: { image: s.media_url, text: "" },
                })),
                0,
                {
                  categoryLabel: highlight.category,
                  categoryGradient: "from-primary to-primary/60",
                }
              )
            }
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="p-[2px] rounded-full ring-2 ring-primary/60 ring-offset-2 ring-offset-background">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                <img
                  src={highlight.cover_image}
                  alt={highlight.category}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[72px]">
              {highlight.category}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CoachHighlightsRow;
