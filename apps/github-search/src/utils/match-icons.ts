import type { IconType } from "react-icons"
import { BiConversation, BiIdCard } from "react-icons/bi"
import { BsFillPersonPlusFill, BsPersonCheckFill } from "react-icons/bs"
import { FaBlog, FaBook, FaDonate, FaInfoCircle, FaTwitter, FaUserCircle } from "react-icons/fa"
import { GiReceiveMoney, GiTakeMyMoney, GiWantedReward } from "react-icons/gi"
import { GrUserManager } from "react-icons/gr"
import { HiOutlineMail } from "react-icons/hi"
import { ImMan } from "react-icons/im"
import { MdKeyboard, MdLocationOn, MdSchool, MdWork } from "react-icons/md"
import { RiAdminLine, RiGitRepositoryLine, RiTimer2Fill, RiTimerFill } from "react-icons/ri"
import { SiCodesandbox } from "react-icons/si"

// TODO: add dynamic import for better performance
export default function matchIcon(key: string): IconType {
  switch (key) {
    case "login":
      return FaUserCircle

    case "databaseId":
      return SiCodesandbox

    case "id":
      return BiIdCard

    case "name":
      return FaUserCircle

    case "company":
      return MdWork

    case "websiteUrl":
      return FaBlog

    case "location":
      return MdLocationOn

    case "email":
      return HiOutlineMail

    case "bio":
      return BiConversation

    case "twitterUsername":
      return FaTwitter

    case "repositories":
      return RiGitRepositoryLine

    case "gists":
      return FaBook

    case "followers":
      return BsFillPersonPlusFill

    case "following":
      return BsPersonCheckFill

    case "createdAt":
      return RiTimerFill

    case "updatedAt":
      return RiTimer2Fill

    case "hasSponsorsListing":
      return FaDonate

    case "isBountyHunter":
      return GiReceiveMoney

    case "isCampusExpert":
      return MdSchool

    case "isDeveloperProgramMember":
      return MdKeyboard

    case "isEmployee":
      return GrUserManager

    case "isHireable":
      return GiWantedReward

    case "isSiteAdmin":
      return RiAdminLine

    case "isSponsoringViewer":
      return GiTakeMyMoney

    case "isViewer":
      return ImMan

    default:
      return FaInfoCircle
  }
}
