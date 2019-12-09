import {Injectable} from "@angular/core";
import {Observable, ReplaySubject} from "rxjs";

@Injectable()
export class FileService {

    public static readonly SIGNATURE_IMAGE_EXTENSION = 'jpeg';
    public static readonly SIGNATURE_IMAGE_TYPE = 'image/jpeg';

    public createFile(dataURL: string, extension: string, type: string): File {
        // Split the base64 string in data and contentType
        const block = dataURL.split(";");

        // get the real base64 content of the file
        const realData = block[1].split(",")[1];

        const sliceSize = 512;
        const byteCharacters = atob(realData);
        const byteArrays = Array
            .from(byteCharacters)
            .reduce((acc: Array<Array<string>>, currentChar: string, currentIndex: number) => {
                const arrayIndex = Math.abs(Math.trunc(currentIndex / sliceSize));
                if (!acc[arrayIndex]) {
                    acc[arrayIndex] = [];
                }
                acc[arrayIndex].push(currentChar);
                return acc;
            }, [])
            .map((bytesNumber) => new Uint8Array(bytesNumber as ArrayLike<any>));

        return new File(
            byteArrays,
            `signature.${extension}`,
            {type}
        );
    }

    public getBase64FromFile(file: File): Observable<string> {
        const res$ = new ReplaySubject<string>(1);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            res$.next(reader.result as string);
            res$.complete();
        };
        reader.onerror = (error) => {
            res$.error(error);
            res$.complete();
        };
        return res$;
    }
}
