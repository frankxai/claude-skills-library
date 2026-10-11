function arg(name) {
  const hit = process.argv.find((item) => item.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : '';
}

export function santaRound({ round, author, reviews }) {
  if (!Number.isInteger(round) || round < 1) {
    return { ship: false, stop: true, reason: 'round must start at 1' };
  }
  if (!Array.isArray(reviews) || reviews.length !== 2) {
    return { ship: false, stop: true, reason: 'santa needs two reviewers' };
  }
  if (reviews.some((review) => review.harness === author)) {
    return { ship: false, stop: true, reason: 'the author graded the work' };
  }
  const graded = reviews.map((review) => {
    if (review.verdict === 'pass' && !String(review.citation || '').trim()) return 'fail';
    return review.verdict === 'pass' ? 'pass' : 'fail';
  });
  if (graded.every((verdict) => verdict === 'pass')) {
    return { ship: true, stop: true, reason: 'both passed with a citation' };
  }
  if (round >= 3) {
    return { ship: false, stop: true, reason: 'three rounds; the remaining list goes to a person' };
  }
  return { ship: false, stop: false, reason: 'fix the cited items and ask again' };
}

const reviewsArg = arg('reviews');
if (reviewsArg) {
  const result = santaRound({
    round: Number(arg('round')),
    author: arg('author'),
    reviews: JSON.parse(reviewsArg),
  });
  console.log(`ship=${result.ship ? 'yes' : 'no'} stop=${result.stop ? 'yes' : 'no'} reason=${result.reason}`);
  process.exit(result.ship ? 0 : 1);
}
