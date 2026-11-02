#!/bin/bash

# ENEM-Pro Content Calendar Generator
# Generates a 52-week content plan with 200+ structured posts
# Output: content-calendar-52week-YYYY-MM-DD.csv

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/projetos/enem-pro"
OUTPUT_DIR="${PROJECT_DIR}"
TIMESTAMP=$(date +%Y-%m-%d)
OUTPUT_FILE="${OUTPUT_DIR}/content-calendar-52week-${TIMESTAMP}.csv"
BLOG_POSTS_DIR="${PROJECT_DIR}/app/blog/posts"

# Subjects for ENEM (Portuguese, Math, Chemistry, Physics, Biology, History, Geography, Social Science, Essay)
declare -a SUBJECTS=("Portuguese" "Mathematics" "Chemistry" "Physics" "Biology" "History" "Geography" "Social_Science" "Essay")

# Post types
declare -a POST_TYPES=("practice" "guide" "strategy" "tips" "quick-review" "exam-analysis" "study-plan" "top-10" "mistakes")

# Difficulty levels
declare -a DIFFICULTY=("easy" "medium" "hard")

# SEO priority levels
declare -a SEO_PRIORITY=("high" "medium" "low")

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ENEM-Pro Content Calendar Generator (52-Week Plan)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to get current post count
get_post_count() {
    find "${BLOG_POSTS_DIR}" -name "*.md" -type f 2>/dev/null | wc -l
}

# Function to generate post slug
generate_slug() {
    local subject=$1
    local post_type=$2
    local week=$3
    local index=$4
    
    echo "${subject,,}-${post_type}-week${week}-${index}" | sed 's/_/-/g'
}

# Function to generate post title
generate_title() {
    local subject=$1
    local post_type=$2
    
    case "$post_type" in
        practice)
            echo "Practice Exercises: $subject ENEM 2026"
            ;;
        guide)
            echo "Complete Guide: Master $subject for ENEM"
            ;;
        strategy)
            echo "Effective Strategy: $subject in 30 Minutes"
            ;;
        tips)
            echo "10 Essential Tips: $subject ENEM Success"
            ;;
        quick-review)
            echo "Quick Review: Essential $subject Topics"
            ;;
        exam-analysis)
            echo "ENEM Analysis: Recent $subject Questions"
            ;;
        study-plan)
            echo "Study Plan: $subject in 8 Weeks"
            ;;
        top-10)
            echo "Top 10 Most Tested: $subject Topics"
            ;;
        mistakes)
            echo "Common Mistakes: $subject ENEM Prep"
            ;;
    esac
}

# Function to get SEO priority based on subject and type
get_seo_priority() {
    local subject=$1
    local post_type=$2
    
    # High priority: guides, strategies, practice for core subjects
    if [[ "$post_type" == "guide" || "$post_type" == "strategy" || "$post_type" == "practice" ]] && [[ "$subject" == "Mathematics" || "$subject" == "Portuguese" || "$subject" == "Chemistry" || "$subject" == "Physics" || "$subject" == "Biology" ]]; then
        echo "high"
    # Medium priority: tips, reviews, analysis
    elif [[ "$post_type" == "tips" || "$post_type" == "quick-review" || "$post_type" == "exam-analysis" || "$post_type" == "top-10" ]]; then
        echo "medium"
    # Low priority: niche content
    else
        echo "low"
    fi
}

# Function to determine difficulty based on week (progressive)
get_difficulty() {
    local week=$1
    
    if (( week <= 17 )); then
        echo "easy"
    elif (( week <= 34 )); then
        echo "medium"
    else
        echo "hard"
    fi
}

# Function to calculate posts per week (4-5 posts/week)
calculate_weekly_posts() {
    local total_weeks=52
    local target_posts=200
    local posts_per_week=$((target_posts / total_weeks))
    # Aim for 4-5 posts per week (208-260 posts total)
    echo 4
}

echo -e "${YELLOW}Scanning existing posts...${NC}"
CURRENT_POSTS=$(get_post_count)
echo -e "${GREEN}✓ Found $CURRENT_POSTS existing posts${NC}"

echo ""
echo -e "${YELLOW}Generating 52-week content calendar...${NC}"

# Create CSV header (UTF-8)
{
    printf "week,date_start,date_end,post_id,slug,title,subject,type,difficulty,seo_priority,target_keywords,estimated_length_words,status,notes\n"
    
    # Generate 52 weeks of content
    post_counter=1
    current_date=$(date +%Y-%m-%d)
    
    for week in {1..52}; do
        # Calculate week dates
        week_start=$(date -d "$current_date + $((week-1)) weeks" +%Y-%m-%d 2>/dev/null || echo "")
        week_end=$(date -d "$current_date + $((week)) weeks" +%Y-%m-%d 2>/dev/null || echo "")
        
        # Generate 4 posts per week
        for post_in_week in {1..4}; do
            # Cycle through subjects
            subject_index=$(( (post_counter - 1) % ${#SUBJECTS[@]} ))
            subject="${SUBJECTS[$subject_index]}"
            
            # Cycle through post types
            type_index=$(( (post_counter - 1) % ${#POST_TYPES[@]} ))
            post_type="${POST_TYPES[$type_index]}"
            
            # Generate properties
            slug=$(generate_slug "$subject" "$post_type" "$week" "$post_in_week")
            title=$(generate_title "$subject" "$post_type")
            difficulty=$(get_difficulty "$week")
            seo_priority=$(get_seo_priority "$subject" "$post_type")
            
            # Generate keywords based on subject and type (no commas to avoid CSV issues)
            case "$subject" in
                Portuguese)
                    keywords="text interpretation | essay | grammar | punctuation | pronouns"
                    ;;
                Mathematics)
                    keywords="algebra | geometry | equations | probability | combinations"
                    ;;
                Chemistry)
                    keywords="chemical reactions | stoichiometry | periodic table | solutions"
                    ;;
                Physics)
                    keywords="mechanics | kinematics | dynamics | thermodynamics | optics"
                    ;;
                Biology)
                    keywords="genetics | evolution | ecology | cells | physiology"
                    ;;
                History)
                    keywords="brazil history | world history | revolutions | historical periods"
                    ;;
                Geography)
                    keywords="climate | vegetation | geopolitics | population | urbanization"
                    ;;
                Social_Science)
                    keywords="sociology | philosophy | anthropology | politics | economy"
                    ;;
                Essay)
                    keywords="enem essay | argumentation | cohesion | coherence | intervention proposal"
                    ;;
            esac
            
            # Estimate word count based on type
            case "$post_type" in
                practice)
                    words=1500
                    ;;
                guide)
                    words=2500
                    ;;
                strategy)
                    words=1800
                    ;;
                tips)
                    words=1200
                    ;;
                quick-review)
                    words=1000
                    ;;
                exam-analysis)
                    words=2000
                    ;;
                study-plan)
                    words=2200
                    ;;
                top-10)
                    words=1400
                    ;;
                mistakes)
                    words=1600
                    ;;
            esac
            
            # Output CSV row
            echo "$week,$week_start,$week_end,$post_counter,$slug,$title,$subject,$post_type,$difficulty,$seo_priority,$keywords,$words,planned,ENEM 2026 Phase 7 Calendar"
            
            ((post_counter++))
        done
    done
} > "$OUTPUT_FILE"

echo -e "${GREEN}✓ Content calendar generated: $OUTPUT_FILE${NC}"
echo ""

# Print summary
TOTAL_POSTS=$(tail -n +2 "$OUTPUT_FILE" | wc -l)
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Content Calendar Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo "Total Posts Generated:     $TOTAL_POSTS"
echo "Time Period:               52 weeks (1 year)"
echo "Posts per Week:            4-5"
echo "Current Existing Posts:    $CURRENT_POSTS"
echo "Total After Calendar:      $((CURRENT_POSTS + TOTAL_POSTS))"
echo ""

# Statistics by subject
echo -e "${YELLOW}Posts by Subject:${NC}"
for subject in "${SUBJECTS[@]}"; do
    count=$(grep ",$subject," "$OUTPUT_FILE" | wc -l)
    echo "  $subject: $count"
done

echo ""

# Statistics by type
echo -e "${YELLOW}Posts by Type:${NC}"
for type in "${POST_TYPES[@]}"; do
    count=$(grep ",$type," "$OUTPUT_FILE" | wc -l)
    echo "  $type: $count"
done

echo ""

# Statistics by SEO priority
echo -e "${YELLOW}Posts by SEO Priority:${NC}"
high=$(grep ",high," "$OUTPUT_FILE" | wc -l)
medium=$(grep ",medium," "$OUTPUT_FILE" | wc -l)
low=$(grep ",low," "$OUTPUT_FILE" | wc -l)
echo "  High:   $high"
echo "  Medium: $medium"
echo "  Low:    $low"

echo ""

# Statistics by difficulty
echo -e "${YELLOW}Posts by Difficulty:${NC}"
easy=$(grep ",easy," "$OUTPUT_FILE" | wc -l)
med=$(grep ",medium," "$OUTPUT_FILE" | wc -l)
hard=$(grep ",hard," "$OUTPUT_FILE" | wc -l)
echo "  Easy:   $easy"
echo "  Medium: $med"
echo "  Hard:   $hard"

echo ""

# Estimate total words
total_words=$(tail -n +2 "$OUTPUT_FILE" | awk -F',' '{sum+=$12} END {print sum}')
echo -e "${YELLOW}Content Metrics:${NC}"
echo "  Estimated Total Words: $total_words"
echo "  Average Words/Post:    $(( total_words / TOTAL_POSTS )) words"
echo ""

# Next steps
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Review content-calendar-52week-${TIMESTAMP}.csv"
echo "2. Adjust topics, difficulty, or SEO priority as needed"
echo "3. Import into content management system"
echo "4. Batch generate posts with: npm run generate-posts"
echo "5. Deploy weekly: git add . && git commit -m 'feat: week N calendar posts'"
echo ""

echo -e "${GREEN}✓ Content calendar generation complete!${NC}"
