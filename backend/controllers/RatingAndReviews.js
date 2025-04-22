const RetingAndReview = require("../models/RatingAndReview")
const course = require("../models/Course");
const {default: mongoose} = require("mongoose");
const Course = require("../models/Course");
const RatingAndReview = require("../models/RatingAndReview");

exports.createRating = async (req,res) => {
    try{

        const userId = req.user.id;
        const {rating , review, courseId} = req.body;

        const courseDetails = await Course.find({ _id: courseId,
            studentsEnrolled: {$elemMatch: {$eq: userId}}
        });

        const alreadyReviewed = await RatingAndReview.findOne({user: userId,
            course: courseId
        });

        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: "Student not enrolled in course"
            });
        }

        if(alreadyReviewed){
            return res.status(404).json({
                success:false,
                message: "Already reviewed", 
            });
        }

        const ratingReview = await RatingAndReview.create({rating,
            review,
            course: courseId,
            user: userId
        });

        await Course.findByIdAndUpdate({ _id: courseId},
            {
                $push: {
                    ratingAndReviews: ratingReview._id
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "Rating added successfully",
            ratingReview
        });

    }catch(error){
        console.log(error);
        res.status(500).json({
            message: error.message,
        });
    }
}

exports.getAverageRating = async (req,res) => {
    try{

        const courseId = req.body.courseId;
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group:{
                    _id: null,
                    averageRating : {$avg: "$rating"}
                }
            }
        ]);

        if(result.length > 0){
            return res.status(200).json({
                averageRating: result[0].averageRating
            });
        }
        else{
            return res.staus(200).json({
                message: "Average rating is 0",
                averageRating: 0
            });
        }
    }catch(error){
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
}

exports.getAllRating = async (req,res) => {
    try{
        const allReviews = await RatingAndReview.find(
        ).sort({rating: -1})
        .populate({path: "user",
            select: "firstName lastName email image"})
            .populate({path: "course",
                select: "courseName"
            }).exec();

            return res.status(200).json({
                success: true,
                message: "All Reviews fetched successfully",
                data: allReviews,
            });
    }catch(error){
        console.log(error);
        res.status(500).json({
            message: error.message
        })
    }
}

