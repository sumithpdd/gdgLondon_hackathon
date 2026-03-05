"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/lib/AuthContext";

interface TagSelectorProps {
  category: "interests" | "expertise" | "techStack";
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  label: string;
}

export function TagSelector({ category, selectedTags, onChange, label }: TagSelectorProps) {
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

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">{label} *</label>
      
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {selectedTags.map(tag => (
            <Badge key={tag} className="bg-blue-600 text-white flex items-center gap-1 px-3 py-1">
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Available Tags */}
      <div className="flex flex-wrap gap-2">
        {availableTags.map(tag => (
          <Badge
            key={tag}
            variant="outline"
            className={`cursor-pointer hover:bg-gray-100 ${
              selectedTags.includes(tag) ? 'hidden' : ''
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Add New Tag */}
      {showInput ? (
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter new tag..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
            autoFocus
          />
          <Button type="button" onClick={addNewTag} size="sm">
            Add
          </Button>
          <Button type="button" onClick={() => {setShowInput(false); setNewTag("");}} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="text-blue-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New {label}
        </Button>
      )}

      <p className="text-xs text-gray-500">
        Click to select existing tags or add your own
      </p>
    </div>
  );
}

