import { User, ChatMessage, CalendarEvent, ChatChannel } from '../types';

const STORAGE_KEYS = {
  USERS: 'fss_users_v1',
  CURRENT_USER: 'fss_current_user_id_v1',
  MESSAGES: 'fss_messages_v1',
  EVENTS: 'fss_events_v1',
  CHANNELS: 'fss_channels_v1'
};

// Initial Seed Data - Coding Community Themed
const SEED_USERS: User[] = [
  {
    id: '1',
    full_name: 'Sarah Chen',
    username: 'backend_sarah',
    tier_level: 3,
    presence_status: 'online',
    hours_this_week: 42.5,
    joined_date: '2023-01-15',
    role: 'Admin',
    bio: 'Full Stack Architect. I dream in Rust and TypeScript.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: '2',
    full_name: 'David Kim',
    username: 'ui_wizard',
    tier_level: 2,
    presence_status: 'online',
    hours_this_week: 28.0,
    joined_date: '2023-03-10',
    role: 'Moderator',
    bio: 'Pixel perfectionist. CSS is my superpower.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
  }
];

const SEED_CHANNELS: ChatChannel[] = [
  { id: 'general', name: 'General', description: 'Community announcements & chill', type: 'public' },
  { id: 'dev-help', name: 'Dev Help', description: 'Stuck on a bug? Ask here.', type: 'public' },
  { id: 'showcase', name: 'Project Showcase', description: 'Show off what you built', type: 'public' },
  { id: 'ai-discussion', name: 'AI & LLMs', description: 'Discussing Gemini, Veo & more', type: 'public' },
];

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Weekly Code Review',
    description: 'Group review of open source PRs.',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 90000000).toISOString(),
    location: 'Voice Channel: Alpha',
    type: 'meeting',
    attendees: 15
  },
  {
    id: 'e2',
    title: 'Hackathon Kickoff',
    description: 'Theme: AI Agents.',
    start_time: new Date(Date.now() + 172800000).toISOString(),
    end_time: new Date(Date.now() + 176400000).toISOString(),
    location: 'Main Hall',
    type: 'raid',
    attendees: 120
  }
];

// Helper to load/save from local storage
const db = {
  get: (key: string, seed: any) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(stored);
    } catch (e) {
      return seed;
    }
  },
  set: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  update: (key: string, updateFn: (data: any) => any) => {
    const current = db.get(key, []);
    const updated = updateFn(current);
    db.set(key, updated);
    return updated;
  }
};

export const base44 = {
  auth: {
    // Simulate Google Sign In / Registration
    loginWithGoogle: async (email: string, name: string, photoUrl: string): Promise<User> => {
      await new Promise(resolve => setTimeout(resolve, 600)); // Network delay
      
      const users = db.get(STORAGE_KEYS.USERS, SEED_USERS);
      let user = users.find((u: User) => u.username === email.split('@')[0] || u.full_name === name);

      if (!user) {
        // Create new user
        user = {
          id: Math.random().toString(36).substr(2, 9),
          full_name: name,
          username: email.split('@')[0] || name.toLowerCase().replace(/\s/g, '_'),
          avatar_url: photoUrl,
          tier_level: 1,
          presence_status: 'online',
          hours_this_week: 0,
          joined_date: new Date().toISOString(),
          role: 'Member',
          bio: 'New member ready to code.'
        };
        db.update(STORAGE_KEYS.USERS, (list) => [...list, user]);
      } else {
        // Update presence on login
        base44.entities.User.update(user.id, { presence_status: 'online' });
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
      return user;
    },
    logout: async () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },
    me: async (): Promise<User | null> => {
      const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!id) return null;
      const users = db.get(STORAGE_KEYS.USERS, SEED_USERS);
      return users.find((u: User) => u.id === id) || null;
    }
  },
  entities: {
    User: {
      list: async (): Promise<User[]> => {
        return db.get(STORAGE_KEYS.USERS, SEED_USERS);
      },
      update: async (id: string, data: Partial<User>): Promise<User> => {
        let updatedUser: User | undefined;
        db.update(STORAGE_KEYS.USERS, (users: User[]) => {
          return users.map(u => {
            if (u.id === id) {
              updatedUser = { ...u, ...data };
              return updatedUser;
            }
            return u;
          });
        });
        if (!updatedUser) throw new Error("User not found");
        return updatedUser;
      }
    },
    CalendarEvent: {
      list: async (sort?: string, limit?: number): Promise<CalendarEvent[]> => {
        let res = db.get(STORAGE_KEYS.EVENTS, SEED_EVENTS);
        if (sort === '-start_time') {
          res.sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }
        if (limit) res = res.slice(0, limit);
        return res;
      }
    },
    Message: {
      list: async (sort?: string, limit?: number): Promise<ChatMessage[]> => {
        let res = db.get(STORAGE_KEYS.MESSAGES, []);
        res.sort((a: ChatMessage, b: ChatMessage) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        if (limit) res = res.slice(0, limit);
        return res;
      },
      send: async (content: string, channelId: string, user: User): Promise<ChatMessage> => {
        const newMsg: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          content,
          sender_id: user.id,
          sender_name: user.full_name,
          sender_tier: user.tier_level,
          created_date: new Date().toISOString(),
          channel_id: channelId
        };
        db.update(STORAGE_KEYS.MESSAGES, (msgs) => [newMsg, ...msgs]);
        return newMsg;
      },
      getByChannel: async (channelId: string): Promise<ChatMessage[]> => {
        const msgs = db.get(STORAGE_KEYS.MESSAGES, []);
        return msgs
          .filter((m: ChatMessage) => m.channel_id === channelId)
          .sort((a: ChatMessage, b: ChatMessage) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      }
    },
    Channel: {
      list: async (): Promise<ChatChannel[]> => {
        return db.get(STORAGE_KEYS.CHANNELS, SEED_CHANNELS);
      }
    }
  }
};