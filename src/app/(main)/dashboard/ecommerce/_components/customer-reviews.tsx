import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShopReview } from "@/lib/dashboards/types";

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function CustomerReviews({ reviews }: { reviews: ShopReview[] }) {
  const featured = reviews[0];
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const filledStars = featured ? Math.round(featured.rating) : 0;
  const avatarInitials = reviews.slice(0, 4).map((review) => getInitials(review.customerName));
  const extraReviewCount = Math.max(reviews.length - avatarInitials.length, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Reviews</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {averageRating.toFixed(1)} average rating
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-foreground">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={index < filledStars ? "size-3.5 fill-current" : "size-3.5 text-muted-foreground"}
                  />
                ))}
              </div>
              <div>
                <div className="font-medium text-sm">{featured?.customerName ?? "No reviews yet"}</div>
                <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">
                  {featured?.body ?? featured?.title ?? "There are no customer reviews to show yet."}
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <Button aria-label="Previous review" size="icon-xs" variant="outline">
                <ArrowLeft />
              </Button>
              <Button aria-label="Next review" size="icon-xs" variant="outline">
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <div className="min-w-0">
            <div className="font-medium text-sm">
              {reviews.length.toLocaleString()} {reviews.length === 1 ? "review" : "reviews"}
            </div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">Latest customer feedback</div>
          </div>

          <AvatarGroup>
            {avatarInitials.map((initials, index) => (
              <Avatar key={`${initials}-${index}`}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}

            {extraReviewCount > 0 ? <AvatarGroupCount>+{extraReviewCount}</AvatarGroupCount> : null}
          </AvatarGroup>
        </div>
      </CardContent>
    </Card>
  );
}
