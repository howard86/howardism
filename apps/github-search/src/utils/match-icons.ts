import {
  BadgeCheck,
  BookOpen,
  Box,
  Building2,
  CircleDollarSign,
  CircleUser,
  Clock,
  GitBranch,
  Globe,
  GraduationCap,
  HandCoins,
  Heart,
  IdCard,
  Info,
  Keyboard,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Shield,
  Timer,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";

export default function matchIcon(key: string): LucideIcon {
  switch (key) {
    case "login":
      return CircleUser;

    case "databaseId":
      return Box;

    case "id":
      return IdCard;

    case "name":
      return CircleUser;

    case "company":
      return Building2;

    case "websiteUrl":
      return Globe;

    case "location":
      return MapPin;

    case "email":
      return Mail;

    case "bio":
      return MessageCircle;

    case "twitterUsername":
      return X;

    case "repositories":
      return GitBranch;

    case "gists":
      return BookOpen;

    case "followers":
      return UserPlus;

    case "following":
      return UserCheck;

    case "createdAt":
      return Timer;

    case "updatedAt":
      return Clock;

    case "hasSponsorsListing":
      return Heart;

    case "isBountyHunter":
      return CircleDollarSign;

    case "isCampusExpert":
      return GraduationCap;

    case "isDeveloperProgramMember":
      return Keyboard;

    case "isEmployee":
      return UserCog;

    case "isHireable":
      return BadgeCheck;

    case "isSiteAdmin":
      return Shield;

    case "isSponsoringViewer":
      return HandCoins;

    case "isViewer":
      return User;

    default:
      return Info;
  }
}
