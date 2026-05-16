"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  category: "interests" | "expertise" | "techStack";
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  label: string;
  /** Dark card styling for hackathon profile / project submission */
  theme?: "default" | "hackathon";
}

export function TagSelector({ category, selectedTags, onChange, label, theme = "default" }: TagSelectorProps) {
  const { user } = useAuthContext();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadTags = async () => {
    try {
      // Map category to collection name
      const collectionMap: Record<string, string> = {
        interests: "Interests",
        expertise: "Expertise",
        techStack: "TechStack",
      };
      
      const collectionName = collectionMap[category];
      const tagsSnapshot = await getDocs(collection(db, collectionName));
      const tags = tagsSnapshot.docs.map(doc => doc.data().name as string);
      setAvailableTags(tags);
    } catch (error) {
      console.error("Error loading tags:", error);
      // Set some default tags if loading fails
      setDefaultTags();
    }
  };

  const setDefaultTags = () => {
    const defaults: Record<string, string[]> = {
      interests: ["Machine Learning", "Web Development", "Mobile Apps", "AI Ethics", "Data Science", "Cloud Computing", "IoT", "Blockchain"],
      expertise: ["Python", "JavaScript", "TensorFlow", "React", "Node.js", "Docker", "AWS", "Git"],
      techStack: ["React", "Next.js", "Python", "TensorFlow", "PyTorch", "Node.js", "MongoDB", "PostgreSQL", "Docker", "Kubernetes"]
    };
    setAvailableTags(defaults[category] || []);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addNewTag = async () => {
    if (!newTag.trim() || !user) return;
    
    const trimmedTag = newTag.trim();
    
    // Check if tag already exists
    if (availableTags.includes(trimmedTag) || selectedTags.includes(trimmedTag)) {
      setNewTag("");
      return;
    }

    try {
      // Map category to collection name
      const collectionMap: Record<string, string> = {
        interests: "Interests",
        expertise: "Expertise",
        techStack: "TechStack",
      };
      
      const collectionName = collectionMap[category];
      const now = new Date();
      // Add to Firestore
      await addDoc(collection(db, collectionName), {
        name: trimmedTag,
        createdAt: now,
        usageCount: 0,
        createdBy: user.uid,
        updatedBy: user.uid,
        createdDate: now,
        updatedDate: now,
      });
      
      // Add to local state
      setAvailableTags([...availableTags, trimmedTag]);
      onChange([...selectedTags, trimmedTag]);
      setNewTag("");
      setShowInput(false);
    } catch (error) {
      console.error("Error adding tag:", error);
      // Still add locally even if Firestore fails
      setAvailableTags([...availableTags, trimmedTag]);
      onChange([...selectedTags, trimmedTag]);
      setNewTag("");
      setShowInput(false);
    }
  };

  const isHackathon = theme === "hackathon";
  const labelClass = isHackathon ? "text-sm font-medium text-gray-200" : "text-sm font-medium text-gray-900";
  const selectedWrapClass = isHackathon
    ? "flex flex-wrap gap-2 p-3 rounded-lg border border-violet-500/30 bg-violet-950/25"
    : "flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200";
  const selectedBadgeClass = isHackathon
    ? "bg-violet-600 text-white flex items-center gap-1 px-3 py-1 border-0"
    : "bg-blue-600 text-white flex items-center gap-1 px-3 py-1";
  const removeHoverClass = isHackathon ? "ml-1 hover:bg-violet-800 rounded-full p-0.5" : "ml-1 hover:bg-blue-700 rounded-full p-0.5";
  const inputClass = isHackathon
    ? "bg-white/5 border-white/15 text-white placeholder:text-gray-500"
    : undefined;
  const addBtnClass = isHackathon
    ? "border-white/20 bg-white/5 text-violet-200 hover:bg-white/10 hover:text-white"
    : "text-blue-600";

  return (
    <div className="space-y-3">
      <label className={labelClass}>{label} *</label>

      {selectedTags.length > 0 && (
        <div className={selectedWrapClass}>
          {selectedTags.map((tag) => (
            <Badge key={tag} className={selectedBadgeClass}>
              {tag}
              <button type="button" onClick={() => toggleTag(tag)} className={removeHoverClass}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={cn(
              isHackathon
                ? "cursor-pointer border-white/20 text-gray-300 bg-transparent hover:bg-white/10"
                : "cursor-pointer hover:bg-gray-100",
              selectedTags.includes(tag) && "hidden"
            )}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {showInput ? (
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter new tag..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void addNewTag())}
            autoFocus
            className={inputClass}
          />
          <Button type="button" onClick={() => void addNewTag()} size="sm" className={isHackathon ? "bg-violet-600 hover:bg-violet-500" : ""}>
            Add
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowInput(false);
              setNewTag("");
            }}
            variant="outline"
            size="sm"
            className={isHackathon ? "border-white/20 text-gray-200 hover:bg-white/10" : ""}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowInput(true)} className={addBtnClass}>
          <Plus className="w-4 h-4 mr-1" />
          Add new {label}
        </Button>
      )}

      <p className={isHackathon ? "text-xs text-gray-500" : "text-xs text-gray-500"}>
        Click to select existing tags or add your own
      </p>
    </div>
  );
}

