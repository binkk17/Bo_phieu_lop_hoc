import { prisma } from "../lib/prisma.js";
import { UserRole } from "../types/role.js";

type CreatePostInput = {
  userId: string;
  contentText?: string;
  imageUrl?: string;
};

export async function createPost(input: CreatePostInput) {
  const post = await prisma.post.create({
    data: {
      userId: input.userId,
      contentText: input.contentText,
      imageUrl: input.imageUrl
    }
  });

  return post;
}

export async function listPosts(viewerRole: UserRole) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          personalCode: true
        }
      }
    }
  });

  return posts.map((post: (typeof posts)[number]) => {
    if (viewerRole === "HIGH") {
      return {
        id: post.id,
        contentText: post.contentText,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        user: {
          id: post.user.id,
          displayName: post.user.displayName,
          personalCode: post.user.personalCode
        }
      };
    }

    const anonymousName = `AnDanh-${post.user.id.slice(-4).toUpperCase()}`;
    return {
      id: post.id,
      contentText: post.contentText,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      anonymousName
    };
  });
}
